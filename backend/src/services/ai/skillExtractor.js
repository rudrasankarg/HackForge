const { callGemini } = require('../gemini');

const SKILL_KEYWORDS = {
  'Machine Learning': ['ml', 'machine learning', 'deep learning', 'neural network', 'tensorflow', 'pytorch', 'sklearn', 'scikit'],
  'Web Development': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'node', 'express', 'django', 'flask', 'nextjs'],
  'Mobile Development': ['android', 'ios', 'flutter', 'react native', 'swift', 'kotlin', 'dart'],
  'DevOps': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'github actions', 'terraform', 'aws', 'gcp', 'azure', 'linux'],
  'Data Science': ['pandas', 'numpy', 'sql', 'data analysis', 'visualization', 'tableau', 'power bi', 'r', 'statistics'],
  'Blockchain': ['blockchain', 'solidity', 'web3', 'ethereum', 'smart contract', 'nft'],
  'Security': ['cybersecurity', 'penetration', 'ethical hacking', 'cryptography', 'security', 'vulnerability'],
  'UI/UX Design': ['figma', 'ui', 'ux', 'design', 'prototype', 'wireframe', 'sketch', 'adobe xd'],
  'Backend': ['java', 'python', 'go', 'rust', 'c++', 'api', 'microservices', 'graphql', 'rest'],
  'Database': ['mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'cassandra', 'elasticsearch'],
};

const EXPERIENCE_SIGNALS = {
  beginner: ['beginner', 'learning', 'student', 'freshman', 'sophomore', '< 1 year', 'newbie', 'novice'],
  intermediate: ['2 years', '3 years', 'intern', 'junior', 'intermediate', '1-3 years'],
  expert: ['senior', 'lead', '5 years', '6 years', '7 years', 'expert', 'architect', 'principal', '4+ years'],
};

function ruleBasedExtraction(bio) {
  const text = (bio || '').toLowerCase();
  const skills = [];
  const domains = [];

  for (const [domain, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      domains.push(domain);
      keywords.filter((kw) => text.includes(kw)).forEach((kw) => {
        const formatted = kw.charAt(0).toUpperCase() + kw.slice(1);
        if (!skills.includes(formatted)) skills.push(formatted);
      });
    }
  }

  let experience = 'beginner';
  for (const [level, signals] of Object.entries(EXPERIENCE_SIGNALS)) {
    if (signals.some((s) => text.includes(s))) { experience = level; break; }
  }

  return { skills: skills.slice(0, 10), domains: domains.slice(0, 4), experience };
}

async function extractSkills(bio) {
  const start = Date.now();

  const geminiResult = await callGemini(
    `Extract structured information from this developer bio/skills description. Return ONLY valid JSON with keys: skills (array of specific tech skills, max 10), domains (array of broad domain categories like "Machine Learning", "Web Development", max 4), experience_level (one of: beginner, intermediate, expert).

Bio: "${bio}"

JSON only, no explanation:`
  );

  if (geminiResult) {
    try {
      const cleaned = geminiResult.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        skills: parsed.skills || [],
        domains: parsed.domains || [],
        experience: parsed.experience_level || 'beginner',
        processingMs: Date.now() - start,
        source: 'gemini',
      };
    } catch { /* fall through to rule-based */ }
  }

  const fallback = ruleBasedExtraction(bio);
  return { ...fallback, processingMs: Date.now() - start, source: 'rule-based' };
}

module.exports = { extractSkills };
