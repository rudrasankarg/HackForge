// Module: Duplicate detection using Levenshtein distance on name + email normalisation

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

function stringSimilarity(a, b) {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(s1, s2) / maxLen;
}

function emailDomainSimilarity(e1, e2) {
  const d1 = (e1 || '').split('@')[1] || '';
  const d2 = (e2 || '').split('@')[1] || '';
  return d1 && d2 && d1 === d2 ? 1 : 0;
}

// Returns similarity score 0-1 between two user objects
function computeDuplicateScore(candidate, existing) {
  const nameSim = stringSimilarity(candidate.name, existing.name);
  const emailLocalSim = stringSimilarity(
    (candidate.email || '').split('@')[0],
    (existing.email || '').split('@')[0]
  );
  const domainSim = emailDomainSimilarity(candidate.email, existing.email);
  const instSim = stringSimilarity(candidate.institution, existing.institution);

  return (nameSim * 0.45) + (emailLocalSim * 0.35) + (domainSim * 0.1) + (instSim * 0.1);
}

// Check a new registration against all existing users; returns { isDuplicate, score, matchedUserId }
async function detectDuplicate(candidate, existingUsers) {
  let highest = { score: 0, matchedUserId: null };

  for (const user of existingUsers) {
    if (user.email === candidate.email) {
      return { isDuplicate: true, score: 1, matchedUserId: user._id };
    }
    const score = computeDuplicateScore(candidate, user);
    if (score > highest.score) highest = { score, matchedUserId: user._id };
  }

  const THRESHOLD = 0.85;
  return {
    isDuplicate: highest.score >= THRESHOLD,
    score: parseFloat(highest.score.toFixed(3)),
    matchedUserId: highest.score >= THRESHOLD ? highest.matchedUserId : null,
  };
}

module.exports = { detectDuplicate, computeDuplicateScore };
