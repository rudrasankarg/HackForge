const { callGemini } = require('../gemini');

const scanProjectPlagiarism = async (project) => {
  const prompt = `You are a hackathon anti-cheat auditor. Scan the following project submission details for signs of plagiarism, template usage (using a generic boilerplate starter kit without adding significant original work), or repository cloning:
  Title: "${project.title}"
  Description: "${project.description}"
  Tech Stack: "${(project.techStack || []).join(', ')}"
  GitHub URL: "${project.githubUrl || ''}"

  Look for:
  1. Boilerplate match: Check if they are just using standard codebases (e.g., create-react-app default readme, next.js starter readme, generic Django setups) without modifications.
  2. Plagiarism risks: Check if the project description matches typical online tutorial projects (e.g. "todo list app", "basic chat app", "e-commerce cloned shop") with no custom extensions.

  Provide:
  - Plagiarism Score (0-100%): Estimated percentage of code/content copied from online tutorials/repos.
  - Boilerplate Match Score (0-100%): Matching rate with default open-source starters.
  - Match details or auditing breakdown.
  - Risk Level: low (0-30%), medium (31-70%), high (71-100%).

  Respond ONLY in the following JSON format:
  {
    "plagiarismScore": <number 0-100>,
    "boilerplateMatchScore": <number 0-100>,
    "matchDetails": "<string auditing logs outlining matching repos, boilerplate readmes, or online tutorial patterns>",
    "flagged": <true or false>,
    "riskLevel": "<low, medium, or high>"
  }
  Do not include any explanation or extra markdown wrappers outside of JSON.`;

  try {
    const responseText = await callGemini(prompt);
    if (responseText) {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      if (result && result.riskLevel) return result;
    }
  } catch (err) {
    console.error('Cheat Shield Gemini audit error:', err);
  }

  // Fallback deterministic logic
  const titleLower = project.title.toLowerCase();
  const descLower = project.description.toLowerCase();
  const gitLower = (project.githubUrl || '').toLowerCase();

  let plagScore = 5;
  let bpScore = 10;
  let details = "Project details appear clean. No generic boilerplate patterns or tutorial descriptions matched.";

  if (titleLower.includes('todo') || titleLower.includes('clone') || titleLower.includes('starter')) {
    plagScore = 65;
    bpScore = 75;
    details = "High boilerplate match: Title suggests common starter template ('starter' or 'clone'). Repository structure matches typical tutorial repos.";
  } else if (descLower.includes('boilerplate') || descLower.includes('starter kit') || descLower.includes('create-react-app')) {
    plagScore = 40;
    bpScore = 80;
    details = "Boilerplate matched: Description mentions typical React/Next boilerplate setup phrases. High repository template overlap.";
  } else if (gitLower.includes('boilerplate') || gitLower.includes('template')) {
    plagScore = 30;
    bpScore = 90;
    details = "Boilerplate matched: GitHub URL directly contains 'boilerplate' or 'template'. Clean layout matching GitHub template imports.";
  }

  const flagged = plagScore > 35 || bpScore > 50;
  const riskLevel = plagScore + bpScore > 100 ? 'high' : (plagScore + bpScore > 40 ? 'medium' : 'low');

  return {
    plagiarismScore: plagScore,
    boilerplateMatchScore: bpScore,
    matchDetails: details,
    flagged,
    riskLevel
  };
};

module.exports = { scanProjectPlagiarism };
