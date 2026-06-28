// Module: Real-time bias detection using Z-score and group ANOVA analysis
const BiasAlert = require('../../models/BiasAlert');

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (arr.length - 1));
}

function zScore(value, arr) {
  const sd = stddev(arr);
  if (sd === 0) return 0;
  return (value - mean(arr)) / sd;
}

// Detect if a reviewer is a scoring outlier vs all other reviewers
function detectReviewerOutlier(reviewerAvg, allReviewerAvgs) {
  const scores = Object.values(allReviewerAvgs);
  if (scores.length < 3) return { isOutlier: false, z: 0 };
  const z = zScore(reviewerAvg, scores);
  return { isOutlier: Math.abs(z) > 2, z: parseFloat(z.toFixed(3)) };
}

// Helper to determine the primary technology category
function getPrimaryCategory(techStack) {
  const counts = {
    'Frontend-heavy': 0,
    'Backend-heavy': 0,
    'AI/ML-heavy': 0,
    'Blockchain': 0
  };
  
  if (!techStack || !Array.isArray(techStack)) return 'Other';
  
  for (const tech of techStack) {
    const t = tech.toLowerCase().trim();
    if (['react', 'vue', 'angular', 'flutter'].includes(t)) {
      counts['Frontend-heavy']++;
    } else if (['node', 'node.js', 'django', 'fastapi', 'spring', 'spring boot'].includes(t)) {
      counts['Backend-heavy']++;
    } else if (['tensorflow', 'pytorch', 'scikit-learn'].includes(t)) {
      counts['AI/ML-heavy']++;
    } else if (['solidity', 'web3', 'web3.js'].includes(t)) {
      counts['Blockchain']++;
    }
  }
  
  let maxCat = 'Other';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxCat = cat;
    }
  }
  return maxCat;
}

// Helper to get institution tier (Tier 1 vs Tier 2)
function getInstitutionTier(user) {
  const uni = (user.university || user.institution || '').toLowerCase();
  const isTier1 = ['iit', 'nit', 'iisc', 'bits pilani', 'bits'].some(keyword => uni.includes(keyword)) ||
                  /iit[a-z\s]*/.test(uni) || /nit[a-z\s]*/.test(uni);
  return isTier1 ? 'Tier 1' : 'Tier 2';
}

// Helper to get geographic region of team members
function getGeographicRegion(teamMembers) {
  const regions = teamMembers.map(m => m.state || m.city || m.demographics?.state || m.demographics?.city || '').filter(Boolean);
  if (regions.length === 0) return 'Unknown';
  const first = regions[0];
  if (regions.every(r => r === first)) {
    return first;
  }
  return 'multi-region';
}

// Helper to normalize evaluations into a standard format
function normalizeEvals(evals, projects = [], users = []) {
  return evals.map(ev => {
    let proj = ev.projectId;
    if (proj && typeof proj === 'object' && proj.title) {
      // already populated
    } else if (proj) {
      proj = projects.find(p => p._id.toString() === proj.toString());
    }
    
    let populatedProj = null;
    if (proj) {
      let teamMembers = proj.teamMembers || [];
      if (teamMembers.length > 0) {
        teamMembers = teamMembers.map(member => {
          if (member && typeof member === 'object' && (member.name || member.demographics)) {
            return member;
          }
          const found = users.find(u => u._id.toString() === member.toString());
          return found || { _id: member };
        });
      }
      
      populatedProj = {
        _id: proj._id,
        title: proj.title,
        techStack: proj.techStack || [],
        teamMembers: teamMembers
      };
    }
    
    return {
      _id: ev._id,
      reviewerId: ev.reviewerId?.toString() || (ev.reviewerId && typeof ev.reviewerId === 'object' && ev.reviewerId._id?.toString()),
      projectId: populatedProj,
      totalScore: ev.totalScore || 0,
      hackathonId: ev.hackathonId?.toString() || (ev.hackathonId && typeof ev.hackathonId === 'object' && ev.hackathonId._id?.toString())
    };
  });
}

// Dimension 1: Scoring Pattern Bias
function checkScoringPattern(value, reviewerScores, projectScores) {
  const z1 = zScore(value, reviewerScores);
  const z2 = zScore(value, projectScores);
  
  if (Math.abs(z1) > 1.5 && Math.abs(z2) > 1.5) {
    const absZ1 = Math.abs(z1);
    let severity = 'low';
    if (absZ1 > 2.5) severity = 'high';
    else if (absZ1 > 2.0) severity = 'medium';
    
    return {
      triggered: true,
      severity,
      message: `Your score of ${value} is statistically anomalous compared to your history (Z-score: ${z1.toFixed(2)}) and project group average (Z-score: ${z2.toFixed(2)}).`,
      detail: `Reviewer history Z-score: ${z1.toFixed(2)}, Project group Z-score: ${z2.toFixed(2)}`,
      zScore: z1
    };
  }
  return { triggered: false };
}

// Dimension 2: Gender Bias
function checkGenderBias(evals) {
  const groups = { 'majority male': [], 'majority female': [], 'mixed': [] };
  
  for (const ev of evals) {
    const project = ev.projectId;
    if (!project) continue;
    const teamMembers = project.teamMembers || [];
    const total = teamMembers.length;
    let genderGroup = 'mixed';
    if (total > 0) {
      const maleCount = teamMembers.filter(m => (m.demographics?.gender || m.gender) === 'male').length;
      const femaleCount = teamMembers.filter(m => (m.demographics?.gender || m.gender) === 'female').length;
      if (maleCount / total > 0.6) genderGroup = 'majority male';
      else if (femaleCount / total > 0.6) genderGroup = 'majority female';
    }
    groups[genderGroup].push(ev.totalScore || 0);
  }
  
  const nonEmptyGroups = Object.entries(groups).filter(([, v]) => v.length > 0);
  const totalEvaluated = evals.length;
  
  if (totalEvaluated < 3 || nonEmptyGroups.length < 2) {
    return { triggered: false };
  }
  
  const allScores = evals.map(e => e.totalScore || 0);
  const overallMean = mean(allScores);
  
  let maxDeviation = 0;
  let affectedGroup = '';
  
  for (const [group, scores] of Object.entries(groups)) {
    if (scores.length === 0) continue;
    const groupMean = mean(scores);
    const deviation = groupMean - overallMean;
    if (Math.abs(deviation) > Math.abs(maxDeviation)) {
      maxDeviation = deviation;
      affectedGroup = group;
    }
  }
  
  const absDev = Math.abs(maxDeviation);
  if (absDev > 12) {
    let severity = 'low';
    if (absDev > 25) severity = 'high';
    else if (absDev > 18) severity = 'medium';
    
    const actionWord = maxDeviation < 0 ? 'under-scored' : 'over-scored';
    
    return {
      triggered: true,
      severity,
      message: `Scoring deviation detected on ${affectedGroup} teams. Your average is ${absDev.toFixed(1)} points ${maxDeviation < 0 ? 'below' : 'above'} your overall average.`,
      detail: `${actionWord.charAt(0).toUpperCase() + actionWord.slice(1)} ${affectedGroup} by ${absDev.toFixed(1)} points`,
      affectedGroup,
      deviation: maxDeviation
    };
  }
  
  return { triggered: false };
}

// Dimension 3: Geographic Bias
function checkGeographicBias(evals) {
  const groups = {};
  for (const ev of evals) {
    const project = ev.projectId;
    if (!project) continue;
    const teamMembers = project.teamMembers || [];
    const region = getGeographicRegion(teamMembers);
    if (region === 'Unknown') continue;
    if (!groups[region]) groups[region] = [];
    groups[region].push(ev.totalScore || 0);
  }
  
  const regionsList = Object.keys(groups);
  if (regionsList.length < 2) {
    return { triggered: false };
  }
  
  const allScores = evals.map(e => e.totalScore || 0);
  const overallMean = mean(allScores);
  
  let maxDeviation = 0;
  let affectedRegion = '';
  
  for (const [region, scores] of Object.entries(groups)) {
    const regionMean = mean(scores);
    const deviation = regionMean - overallMean;
    if (Math.abs(deviation) > Math.abs(maxDeviation)) {
      maxDeviation = deviation;
      affectedRegion = region;
    }
  }
  
  const absDev = Math.abs(maxDeviation);
  if (absDev > 15) {
    let severity = 'low';
    if (absDev > 28) severity = 'high';
    else if (absDev > 20) severity = 'medium';
    
    const actionWord = maxDeviation < 0 ? 'under-scored' : 'over-scored';
    
    return {
      triggered: true,
      severity,
      message: `Scoring deviation detected on ${affectedRegion} teams. Your average is ${absDev.toFixed(1)} points ${maxDeviation < 0 ? 'below' : 'above'} your overall average.`,
      detail: `${actionWord.charAt(0).toUpperCase() + actionWord.slice(1)} ${affectedRegion} by ${absDev.toFixed(1)} points`,
      affectedRegion,
      deviation: maxDeviation
    };
  }
  
  return { triggered: false };
}

// Dimension 4: Institutional Bias
function checkInstitutionalBias(evals) {
  const groups = { 'Tier 1': [], 'Tier 2': [] };
  for (const ev of evals) {
    const project = ev.projectId;
    if (!project) continue;
    const teamMembers = project.teamMembers || [];
    const tiers = teamMembers.map(m => getInstitutionTier(m));
    const tier1Count = tiers.filter(t => t === 'Tier 1').length;
    const projectTier = (tier1Count >= tiers.length / 2 && tiers.length > 0) ? 'Tier 1' : 'Tier 2';
    groups[projectTier].push(ev.totalScore || 0);
  }
  
  if (groups['Tier 1'].length < 2 || groups['Tier 2'].length < 2) {
    return { triggered: false };
  }
  
  const meanTier1 = mean(groups['Tier 1']);
  const meanTier2 = mean(groups['Tier 2']);
  const diff = meanTier1 - meanTier2;
  const absDiff = Math.abs(diff);
  
  if (absDiff > 15) {
    let severity = 'low';
    if (absDiff > 30) severity = 'high';
    else if (absDiff > 22) severity = 'medium';
    
    const favoredTier = diff > 0 ? 'Tier 1' : 'Tier 2';
    
    return {
      triggered: true,
      severity,
      message: `Scoring difference between Tier 1 and Tier 2 teams is ${absDiff.toFixed(1)} points.`,
      detail: `Favored ${favoredTier} teams by ${absDiff.toFixed(1)} points`,
      favoredTier,
      difference: diff
    };
  }
  
  return { triggered: false };
}

// Dimension 5: Technology Stack Bias
function checkTechStackBias(evals) {
  const groups = {};
  for (const ev of evals) {
    const project = ev.projectId;
    if (!project) continue;
    const cat = getPrimaryCategory(project.techStack);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(ev.totalScore || 0);
  }
  
  const nonEmptyCats = Object.entries(groups).filter(([, v]) => v.length > 0);
  if (nonEmptyCats.length < 2) {
    return { triggered: false };
  }
  
  const allScores = evals.map(e => e.totalScore || 0);
  const overallMean = mean(allScores);
  
  let maxDeviation = 0;
  let affectedCat = '';
  
  for (const [cat, scores] of Object.entries(groups)) {
    const catMean = mean(scores);
    const deviation = catMean - overallMean;
    if (Math.abs(deviation) > Math.abs(maxDeviation)) {
      maxDeviation = deviation;
      affectedCat = cat;
    }
  }
  
  const absDev = Math.abs(maxDeviation);
  if (absDev > 12) {
    let severity = 'low';
    if (absDev > 25) severity = 'high';
    else if (absDev > 18) severity = 'medium';
    
    const actionWord = maxDeviation < 0 ? 'under-scored' : 'over-scored';
    
    return {
      triggered: true,
      severity,
      message: `Scoring deviation detected on ${affectedCat} teams. Your average is ${absDev.toFixed(1)} points ${maxDeviation < 0 ? 'below' : 'above'} your overall average.`,
      detail: `${actionWord.charAt(0).toUpperCase() + actionWord.slice(1)} ${affectedCat} by ${absDev.toFixed(1)} points`,
      affectedCat,
      deviation: maxDeviation
    };
  }
  
  return { triggered: false };
}

// Upsert logic for alert deduplication
async function upsertBiasAlert(hackathonId, reviewerId, dimension, severity, description, statisticalDetail, zScoreVal = null, affectedProjectId = null) {
  const BiasAlert = require('../../models/BiasAlert');
  const existing = await BiasAlert.findOne({
    hackathonId,
    affectedReviewerId: reviewerId,
    dimension,
    resolved: false
  });
  
  if (existing) {
    existing.severity = severity;
    existing.description = description;
    existing.statisticalDetail = statisticalDetail;
    if (zScoreVal !== null) existing.zScore = zScoreVal;
    if (affectedProjectId !== null) existing.affectedProjectId = affectedProjectId;
    await existing.save();
  } else {
    const alert = new BiasAlert({
      hackathonId,
      dimension,
      severity,
      description,
      affectedReviewerId: reviewerId,
      affectedProjectId,
      zScore: zScoreVal,
      statisticalDetail,
      resolved: false
    });
    await alert.save();
  }
}

// Primary execution logic for a batch run or bulk analysis
async function runBiasAnalysis(hackathonId, evaluations, reviewers, projects) {
  const User = require('../../models/User');
  const participants = await User.find({ role: 'participant' });
  const allUsers = [...reviewers, ...participants];
  
  const normalized = normalizeEvals(evaluations, projects, allUsers);
  const reviewerEvals = {};
  for (const ev of normalized) {
    if (!ev.reviewerId) continue;
    if (!reviewerEvals[ev.reviewerId]) reviewerEvals[ev.reviewerId] = [];
    reviewerEvals[ev.reviewerId].push(ev);
  }
  
  const alerts = [];
  
  for (const [reviewerId, evs] of Object.entries(reviewerEvals)) {
    const overallScores = evs.map(e => e.totalScore);
    
    // Scoring pattern (per-project evaluation)
    for (const currentEval of evs) {
      if (!currentEval.projectId) continue;
      const projectEvals = normalized.filter(e => e.projectId && e.projectId._id.toString() === currentEval.projectId._id.toString());
      const projectScores = projectEvals.map(e => e.totalScore);
      
      const scoringRes = checkScoringPattern(currentEval.totalScore, overallScores, projectScores);
      if (scoringRes.triggered) {
        alerts.push({
          hackathonId,
          dimension: 'scoring_pattern',
          severity: scoringRes.severity,
          description: scoringRes.message,
          affectedReviewerId: reviewerId,
          affectedProjectId: currentEval.projectId._id,
          zScore: scoringRes.zScore,
          statisticalDetail: scoringRes.detail
        });
      }
    }
    
    // Gender
    const genderRes = checkGenderBias(evs);
    if (genderRes.triggered) {
      alerts.push({
        hackathonId,
        dimension: 'gender_bias',
        severity: genderRes.severity,
        description: genderRes.message,
        affectedReviewerId: reviewerId,
        statisticalDetail: genderRes.detail
      });
    }
    
    // Geographic
    const geoRes = checkGeographicBias(evs);
    if (geoRes.triggered) {
      alerts.push({
        hackathonId,
        dimension: 'geographic_bias',
        severity: geoRes.severity,
        description: geoRes.message,
        affectedReviewerId: reviewerId,
        statisticalDetail: geoRes.detail
      });
    }
    
    // Institutional
    const instRes = checkInstitutionalBias(evs);
    if (instRes.triggered) {
      alerts.push({
        hackathonId,
        dimension: 'institutional_bias',
        severity: instRes.severity,
        description: instRes.message,
        affectedReviewerId: reviewerId,
        statisticalDetail: instRes.detail
      });
    }
    
    // Tech stack
    const techRes = checkTechStackBias(evs);
    if (techRes.triggered) {
      alerts.push({
        hackathonId,
        dimension: 'tech_stack_bias',
        severity: techRes.severity,
        description: techRes.message,
        affectedReviewerId: reviewerId,
        statisticalDetail: techRes.detail
      });
    }
  }
  
  for (const alert of alerts) {
    await upsertBiasAlert(
      alert.hackathonId,
      alert.affectedReviewerId,
      alert.dimension,
      alert.severity,
      alert.description,
      alert.statisticalDetail,
      alert.zScore,
      alert.affectedProjectId
    );
  }
  
  return alerts;
}

// Single-reviewer trigger on evaluation submission
async function runReviewerBiasChecks(hackathonId, reviewerId, currentEvalId) {
  const Evaluation = require('../../models/Evaluation');
  const evals = await Evaluation.find({ reviewerId, hackathonId, status: 'completed' })
    .populate({
      path: 'projectId',
      populate: { path: 'teamMembers' }
    });
    
  if (evals.length === 0) return;
  
  const normalized = normalizeEvals(evals);
  
  let currentEval = null;
  if (currentEvalId) {
    currentEval = normalized.find(e => e._id.toString() === currentEvalId.toString());
  } else {
    currentEval = [...normalized].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
  }
  if (!currentEval || !currentEval.projectId) return;
  
  const overallScores = normalized.map(e => e.totalScore);
  
  // Scoring pattern
  const allProjectEvals = await Evaluation.find({ projectId: currentEval.projectId._id, hackathonId, status: 'completed' });
  const projectScores = allProjectEvals.map(e => e.totalScore);
  
  const scoringRes = checkScoringPattern(currentEval.totalScore, overallScores, projectScores);
  if (scoringRes.triggered) {
    await upsertBiasAlert(hackathonId, reviewerId, 'scoring_pattern', scoringRes.severity, scoringRes.message, scoringRes.detail, scoringRes.zScore, currentEval.projectId._id);
  }
  
  // Gender
  const genderRes = checkGenderBias(normalized);
  if (genderRes.triggered) {
    await upsertBiasAlert(hackathonId, reviewerId, 'gender_bias', genderRes.severity, genderRes.message, genderRes.detail, null, null);
  }
  
  // Geographic
  const geoRes = checkGeographicBias(normalized);
  if (geoRes.triggered) {
    await upsertBiasAlert(hackathonId, reviewerId, 'geographic_bias', geoRes.severity, geoRes.message, geoRes.detail, null, null);
  }
  
  // Institutional
  const instRes = checkInstitutionalBias(normalized);
  if (instRes.triggered) {
    await upsertBiasAlert(hackathonId, reviewerId, 'institutional_bias', instRes.severity, instRes.message, instRes.detail, null, null);
  }
  
  // Tech stack
  const techRes = checkTechStackBias(normalized);
  if (techRes.triggered) {
    await upsertBiasAlert(hackathonId, reviewerId, 'tech_stack_bias', techRes.severity, techRes.message, techRes.detail, null, null);
  }
}

// Pre-submission check dry run
async function previewBiasWarnings(hackathonId, reviewerId, projectId, candidateScore) {
  const Evaluation = require('../../models/Evaluation');
  const Project = require('../../models/Project');
  
  const evals = await Evaluation.find({ reviewerId, hackathonId, status: 'completed' })
    .populate({
      path: 'projectId',
      populate: { path: 'teamMembers' }
    });
    
  const candidateProject = await Project.findById(projectId).populate('teamMembers');
  if (!candidateProject) return { hasBiasWarning: false, warnings: [] };
  
  const scoreNum = Number(candidateScore);
  const normalized = normalizeEvals(evals);
  
  const simulatedEval = {
    _id: new (require('mongoose').Types.ObjectId)(),
    reviewerId: reviewerId.toString(),
    projectId: {
      _id: candidateProject._id,
      title: candidateProject.title,
      techStack: candidateProject.techStack || [],
      teamMembers: candidateProject.teamMembers || []
    },
    totalScore: scoreNum,
    hackathonId: hackathonId.toString()
  };
  
  const simulatedEvals = [...normalized, simulatedEval];
  const warnings = [];
  
  // Scoring pattern
  const otherEvals = await Evaluation.find({ projectId, status: 'completed', reviewerId: { $ne: reviewerId } });
  const projectScores = [...otherEvals.map(e => e.totalScore), scoreNum];
  const overallScores = simulatedEvals.map(e => e.totalScore);
  
  const scoringRes = checkScoringPattern(scoreNum, overallScores, projectScores);
  if (scoringRes.triggered) {
    warnings.push({
      type: 'scoring_pattern',
      severity: scoringRes.severity,
      message: scoringRes.message,
      detail: scoringRes.detail,
      zScore: scoringRes.zScore
    });
  }
  
  // Gender
  const genderRes = checkGenderBias(simulatedEvals);
  if (genderRes.triggered) {
    warnings.push({
      type: 'gender_bias',
      severity: genderRes.severity,
      message: genderRes.message,
      detail: genderRes.detail
    });
  }
  
  // Geographic
  const geoRes = checkGeographicBias(simulatedEvals);
  if (geoRes.triggered) {
    warnings.push({
      type: 'geographic_bias',
      severity: geoRes.severity,
      message: geoRes.message,
      detail: geoRes.detail
    });
  }
  
  // Institutional
  const instRes = checkInstitutionalBias(simulatedEvals);
  if (instRes.triggered) {
    warnings.push({
      type: 'institutional_bias',
      severity: instRes.severity,
      message: instRes.message,
      detail: instRes.detail
    });
  }
  
  // Tech stack
  const techRes = checkTechStackBias(simulatedEvals);
  if (techRes.triggered) {
    warnings.push({
      type: 'tech_stack_bias',
      severity: techRes.severity,
      message: techRes.message,
      detail: techRes.detail
    });
  }
  
  return {
    hasBiasWarning: warnings.length > 0,
    warnings
  };
}

module.exports = {
  runBiasAnalysis,
  detectReviewerOutlier,
  zScore,
  mean,
  stddev,
  runReviewerBiasChecks,
  previewBiasWarnings
};
