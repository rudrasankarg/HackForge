const { callGemini } = require('../gemini');

function normalizeScores(evaluations) {
  // Per-reviewer z-score normalization to neutralize harsh/lenient reviewers
  const byReviewer = {};
  for (const ev of evaluations) {
    const rid = ev.reviewerId.toString();
    if (!byReviewer[rid]) byReviewer[rid] = [];
    byReviewer[rid].push(ev.totalScore);
  }

  const normalized = evaluations.map((ev) => {
    const rid = ev.reviewerId.toString();
    const scores = byReviewer[rid];
    const m = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sd = scores.length > 1
      ? Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - m, 2), 0) / scores.length)
      : 1;
    const normalizedScore = sd === 0 ? ev.totalScore : ((ev.totalScore - m) / sd) * 10 + 50;
    return { ...ev.toObject?.() ?? ev, normalizedScore: parseFloat(normalizedScore.toFixed(2)) };
  });

  return normalized;
}

function rankProjects(evaluations, projects) {
  const projectScores = {};
  const projectCounts = {};
  const projectScoreLists = {};

  for (const ev of evaluations) {
    const pid = ev.projectId.toString();
    if (!projectScores[pid]) {
      projectScores[pid] = 0;
      projectCounts[pid] = 0;
      projectScoreLists[pid] = [];
    }
    const scoreVal = ev.normalizedScore ?? ev.totalScore;
    projectScores[pid] += scoreVal;
    projectCounts[pid]++;
    projectScoreLists[pid].push(scoreVal);
  }

  const ranked = projects
    .filter((p) => projectScores[p._id.toString()] !== undefined)
    .map((p) => {
      const pid = p._id.toString();
      const avg = projectCounts[pid] > 0 ? projectScores[pid] / projectCounts[pid] : 0;
      const count = projectCounts[pid] || 0;
      
      const scores = projectScoreLists[pid] || [];
      let confidenceScore = 0;
      if (scores.length === 1) {
        confidenceScore = 50;
      } else if (scores.length >= 2) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        confidenceScore = Math.max(0, Math.min(100, (1 - (stdDev / 20)) * 100));
      }
      confidenceScore = parseFloat(confidenceScore.toFixed(1));

      // Confidence interval: ±1.96 * (10/sqrt(n)) — simplified
      const ci = parseFloat((1.96 * (10 / Math.sqrt(count || 1))).toFixed(2));
      return {
        project: { ...(p.toObject?.() ?? p), confidenceScore },
        finalScore: parseFloat(avg.toFixed(2)),
        evaluationCount: count,
        confidenceInterval: ci,
        confidenceScore
      };
    });

  ranked.sort((a, b) => {
    if (Math.abs(b.finalScore - a.finalScore) < 0.5) {
      // Tie-break: submission time
      return new Date(a.project.submittedAt) - new Date(b.project.submittedAt);
    }
    return b.finalScore - a.finalScore;
  });

  return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
}

async function generateFeedback(project, rank, finalScore) {
  const prompt = `You are a hackathon judge assistant. Generate brief, encouraging and constructive feedback for a team. Keep it under 80 words.

Project: "${project.title}"
Description: "${project.description}"
Tech Stack: ${(project.techStack || []).join(', ')}
Final Rank: #${rank}
Score: ${finalScore}/100

Write 2-3 sentences: mention one strength, one improvement area, and acknowledge their effort. Be specific to their project.`;

  const aiText = await callGemini(prompt);
  if (aiText) return aiText.trim();

  const feedbackTemplates = [
    `Great work on ${project.title}! Your use of ${project.techStack?.[0] || 'technology'} showed real creativity. Consider deepening the technical implementation and adding more real-world validation for a stronger impact.`,
    `The ${project.title} project demonstrated solid problem-solving. The core concept is well-defined; strengthening the presentation and polish could elevate it further. Well done on the submission!`,
    `${project.title} tackled a meaningful challenge. The innovative approach stands out — focus on scalability and user experience in future iterations. Impressive effort overall!`,
  ];
  return feedbackTemplates[rank % feedbackTemplates.length];
}

async function processResults(evaluations, projects) {
  const normalized = normalizeScores(evaluations);
  const ranked = rankProjects(normalized, projects);

  const resultsWithFeedback = [];
  for (const r of ranked) {
    const feedback = await generateFeedback(r.project, r.rank, r.finalScore);
    resultsWithFeedback.push({ ...r, feedback });
  }

  return resultsWithFeedback;
}

module.exports = { processResults, normalizeScores, rankProjects };
