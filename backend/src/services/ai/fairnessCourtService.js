const Project = require('../../models/Project');
const Evaluation = require('../../models/Evaluation');
const User = require('../../models/User');

const { callGemini } = require('../gemini');
const { mean, stddev, zScore, detectReviewerOutlier } = require('./biasDetector');

const getFairnessCourtVerdict = async (hackathonId) => {
  try {
    // 1. Gather data
    const projects = await Project.find({ hackathonId }).populate('teamMembers');
    const evaluations = await Evaluation.find({ hackathonId, status: 'completed' }).populate('reviewerId');

    if (!evaluations.length) {
      return {
        verdict: "No completed evaluations recorded for this hackathon yet. AI Fairness Court cannot convene.",
        suspicious: [],
        biasPatterns: [],
        instability: [],
        stats: { totalProjects: projects.length, totalEvaluations: 0 }
      };
    }

    // 2. Suspicious evaluations & outlier reviewers
    const reviewerScores = {};
    for (const ev of evaluations) {
      const rid = ev.reviewerId?._id?.toString() || 'unknown';
      if (!reviewerScores[rid]) {
        reviewerScores[rid] = {
          name: ev.reviewerId?.name || 'Unknown Reviewer',
          scores: []
        };
      }
      reviewerScores[rid].scores.push(ev.totalScore);
    }

    const reviewerAvgs = {};
    for (const [rid, data] of Object.entries(reviewerScores)) {
      reviewerAvgs[rid] = mean(data.scores);
    }

    const suspicious = [];
    const reviewerIds = Object.keys(reviewerAvgs);
    if (reviewerIds.length >= 3) {
      const allAvgs = Object.values(reviewerAvgs);
      for (const [rid, data] of Object.entries(reviewerScores)) {
        const avg = mean(data.scores);
        const { isOutlier, z } = detectReviewerOutlier(avg, reviewerAvgs);
        if (isOutlier) {
          suspicious.push({
            type: 'Reviewer Outlier',
            reviewer: data.name,
            reason: `Average score given is ${avg.toFixed(1)}/50 (Z-score: ${z}). Significantly ${z < 0 ? 'harsher' : 'more lenient'} than other reviewers.`,
            severity: Math.abs(z) > 2.5 ? 'high' : 'medium'
          });
        }
      }
    }

    // 3. Bias patterns
    const biasPatterns = [];
    
    // Gender bias check
    const genderScores = { male: [], female: [], other: [] };
    for (const ev of evaluations) {
      const proj = projects.find(p => p._id.toString() === ev.projectId.toString());
      if (proj && proj.teamMembers) {
        for (const m of proj.teamMembers) {
          const gen = m.demographics?.gender || 'other';
          if (genderScores[gen]) genderScores[gen].push(ev.totalScore);
        }
      }
    }
    const maleAvg = mean(genderScores.male);
    const femaleAvg = mean(genderScores.female);
    if (genderScores.male.length >= 2 && genderScores.female.length >= 2) {
      const diff = Math.abs(maleAvg - femaleAvg);
      if (diff > 8) {
        biasPatterns.push({
          dimension: 'Gender Deviation',
          message: `Teams with male members averaged ${maleAvg.toFixed(1)}, while teams with female members averaged ${femaleAvg.toFixed(1)} (Diff: ${diff.toFixed(1)} pts).`,
          severity: diff > 15 ? 'high' : 'medium'
        });
      }
    }

    // University tier bias check
    const tierScores = { 'Tier 1': [], 'Tier 2': [] };
    for (const ev of evaluations) {
      const proj = projects.find(p => p._id.toString() === ev.projectId.toString());
      if (proj && proj.teamMembers) {
        const uni = (proj.teamMembers[0]?.university || proj.teamMembers[0]?.institution || '').toLowerCase();
        const isTier1 = ['iit', 'nit', 'iisc', 'bits pilani', 'bits'].some(keyword => uni.includes(keyword));
        const tier = isTier1 ? 'Tier 1' : 'Tier 2';
        tierScores[tier].push(ev.totalScore);
      }
    }
    const t1Avg = mean(tierScores['Tier 1']);
    const t2Avg = mean(tierScores['Tier 2']);
    if (tierScores['Tier 1'].length >= 2 && tierScores['Tier 2'].length >= 2) {
      const diff = Math.abs(t1Avg - t2Avg);
      if (diff > 8) {
        biasPatterns.push({
          dimension: 'Institutional Bias',
          message: `Tier 1 institutions averaged ${t1Avg.toFixed(1)}, whereas Tier 2 averaged ${t2Avg.toFixed(1)} (Diff: ${diff.toFixed(1)} pts).`,
          severity: diff > 15 ? 'high' : 'medium'
        });
      }
    }

    // 4. Ranking instability
    const projectScores = {};
    for (const ev of evaluations) {
      const pid = ev.projectId.toString();
      if (!projectScores[pid]) projectScores[pid] = [];
      projectScores[pid].push(ev.totalScore);
    }

    const instability = [];
    for (const [pid, scores] of Object.entries(projectScores)) {
      if (scores.length >= 2) {
        const sd = stddev(scores);
        if (sd > 8) { // high disagreement among reviewers
          const proj = projects.find(p => p._id.toString() === pid);
          instability.push({
            projectId: pid,
            projectTitle: proj?.title || 'Unknown Project',
            scores: scores.join(', '),
            stdDev: parseFloat(sd.toFixed(2)),
            message: `Reviewers strongly disagreed on this project, giving scores ranging from ${Math.min(...scores)} to ${Math.max(...scores)} (Std Dev: ${sd.toFixed(2)}).`
          });
        }
      }
    }

    // 5. Generate Gemini verdict
    const prompt = `You are the Chief Justice of the AI Fairness Court™. Your job is to review the hackathon's grading analytics and issue a definitive verdict on whether the evaluations were fair, where the anomalies lie, and how organizers can fix them.

    HACKATHON GRADING SUMMARY:
    - Total Submitted Projects: ${projects.length}
    - Total Completed Evaluations: ${evaluations.length}
    
    DETECTED ANOMALIES & OUTLIERS:
    ${suspicious.length ? suspicious.map(s => `- [Outlier] Reviewer ${s.reviewer}: ${s.reason}`).join('\n') : 'None detected.'}

    DETECTED BIAS PATTERNS:
    ${biasPatterns.length ? biasPatterns.map(b => `- [Bias] ${b.dimension}: ${b.message}`).join('\n') : 'None detected.'}

    RANKING INSTABILITY (HIGH REVIEWER DISAGREEMENT):
    ${instability.length ? instability.map(i => `- [Instability] Project "${i.projectTitle}": ${i.message}`).join('\n') : 'None detected.'}

    Write a judicial verdict report (maximum 200 words) using Markdown:
    - Include a clear Court Verdict (e.g. "APPROVED WITH RECOMMENDATIONS" or "FAIRNESS CONDEMNED").
    - Highlight the main concern (outliers, university bias, or disagreement).
    - Give 2 brief actionable recommendations.
    Be professional, authoritative, and concise.`;

    const verdictText = await callGemini(prompt);

    let finalVerdict = verdictText;
    if (!finalVerdict) {
      // Fallback verdict report using statistical summaries
      finalVerdict = `### AI Fairness Court™ - Judicial Verdict Report\n\n**Case:** Hackathon Grading Analytics Review\n**Status:** ${suspicious.length > 0 || biasPatterns.length > 0 ? 'INTEGRITY COMPROMISED: ACTION REQUIRED' : 'APPROVED WITH RECOMMENDATIONS'}\n\n`;
      if (suspicious.length > 0) {
        finalVerdict += `**Scoring Outliers:** The court has flagged suspicious grading behavior. Specifically, reviewer **${suspicious[0].reviewer}** is acting as a statistical outlier. Their scores deviate significantly from the group norm.\n\n`;
      } else {
        finalVerdict += `**Scoring Outliers:** No reviewer outliers detected. Evaluation scores fall within expected normal deviations.\n\n`;
      }
      
      if (biasPatterns.length > 0) {
        finalVerdict += `**Bias Warning:** Group deviations indicate potential bias. *${biasPatterns[0].message}*\n\n`;
      } else {
        finalVerdict += `**Bias Warning:** No systemic demographic, technology, or institutional bias detected across evaluations.\n\n`;
      }

      if (instability.length > 0) {
        finalVerdict += `**Ranking Instability:** High standard deviation detected for **${instability[0].projectTitle}** (Std Dev: ${instability[0].stdDev}). Reviewers strongly disagreed on this project's score.\n\n`;
      }

      finalVerdict += `**Recommendations:**\n1. Calibrate scoring outliers through panel arbitration or z-score normalization.\n2. Maintain at least three evaluations per project for future events to stabilize rankings.`;
    }

    return {
      verdict: finalVerdict,
      suspicious,
      biasPatterns,
      instability,
      stats: {
        totalProjects: projects.length,
        totalEvaluations: evaluations.length,
        averageScore: mean(evaluations.map(e => e.totalScore)).toFixed(1)
      }
    };
  } catch (err) {

    console.error('Fairness Court generation error:', err);
    throw err;
  }
};

module.exports = { getFairnessCourtVerdict };
