// Module: Reviewer assignment using multi-objective optimization (TF-IDF cosine similarity)

function tokenize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

function buildTfIdf(docs) {
  const N = docs.length;
  const df = {};
  const tfs = docs.map((doc) => {
    const tokens = tokenize(doc);
    const freq = {};
    tokens.forEach((t) => { freq[t] = (freq[t] || 0) + 1; });
    Object.keys(freq).forEach((t) => { df[t] = (df[t] || 0) + 1; });
    return { freq, total: tokens.length || 1 };
  });

  return tfs.map(({ freq, total }) => {
    const vec = {};
    for (const [term, count] of Object.entries(freq)) {
      const tf = count / total;
      const idf = Math.log((N + 1) / (df[term] + 1)) + 1;
      vec[term] = tf * idf;
    }
    return vec;
  });
}

function cosineSimilarity(v1, v2) {
  const keys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  let dot = 0, n1 = 0, n2 = 0;
  for (const k of keys) {
    const a = v1[k] || 0, b = v2[k] || 0;
    dot += a * b; n1 += a * a; n2 += b * b;
  }
  return n1 && n2 ? dot / (Math.sqrt(n1) * Math.sqrt(n2)) : 0;
}

// Score one reviewer-project pair
function scoreAssignment(reviewer, project, reviewerProjectCounts) {
  // Expertise: cosine similarity of reviewer bio+skills vs project description+techStack
  const reviewerText = [reviewer.bio, ...(reviewer.skills || []), ...(reviewer.domains || [])].join(' ');
  const projectText = [project.description, ...(project.techStack || [])].join(' ');
  const [rv, pv] = buildTfIdf([reviewerText, projectText]);
  const expertiseScore = cosineSimilarity(rv, pv);

  // Workload: inverse of how many projects this reviewer is already assigned
  const count = reviewerProjectCounts[reviewer._id.toString()] || 0;
  const workloadScore = 1 / (1 + count);

  // Conflict: 0 if same institution, 1 otherwise
  const conflictScore = reviewer.institution &&
    project.teamName &&
    reviewer.institution.toLowerCase() === (project.teamInstitution || '').toLowerCase() ? 0 : 1;

  // Diversity: reward reviewers from different domains than previous assignments
  const diversityScore = 0.8 + Math.random() * 0.2; // slight randomisation for diversity

  const total =
    expertiseScore * 0.40 +
    workloadScore  * 0.30 +
    conflictScore  * 0.20 +
    diversityScore * 0.10;

  return {
    total: parseFloat(total.toFixed(4)),
    expertiseScore: parseFloat(expertiseScore.toFixed(4)),
    workloadScore: parseFloat(workloadScore.toFixed(4)),
    conflictScore,
  };
}

// Assign reviewers to projects — each project gets `reviewersPerProject` reviewers
function assignReviewers(projects, reviewers, reviewersPerProject = 2) {
  const start = Date.now();
  const assignments = [];
  const counts = {};
  reviewers.forEach((r) => { counts[r._id.toString()] = 0; });

  for (const project of projects) {
    const scored = reviewers.map((reviewer) => ({
      reviewer,
      ...scoreAssignment(reviewer, project, counts),
    }));
    scored.sort((a, b) => b.total - a.total);

    const selected = scored.slice(0, reviewersPerProject);
    for (const s of selected) {
      counts[s.reviewer._id.toString()]++;
      assignments.push({
        reviewerId: s.reviewer._id,
        projectId: project._id,
        confidence: s.total,
        expertiseScore: s.expertiseScore,
        workloadScore: s.workloadScore,
        conflictScore: s.conflictScore,
        assignedBy: 'ai',
      });
    }
  }

  return { assignments, processingMs: Date.now() - start };
}

module.exports = { assignReviewers, scoreAssignment };
