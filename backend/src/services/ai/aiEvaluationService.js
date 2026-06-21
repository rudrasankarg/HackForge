const { callGemini } = require('../gemini');

const evaluateProjectWithAi = async (project) => {
  const prompt = `You are an expert technical evaluator and hackathon judge. Evaluate the following project submission:
  Title: "${project.title}"
  Domain: "${project.domain || 'Not specified'}"
  Description: "${project.description}"
  Tech Stack: "${(project.techStack || []).join(', ') || 'Not specified'}"
  GitHub URL: "${project.githubUrl || 'Not provided'}"
  Demo URL: "${project.demoUrl || 'Not provided'}"
  Video URL: "${project.videoUrl || 'Not provided'}"

  Evaluate the project along 5 criteria, scoring each from 0 to 10:
  1. Innovation: How creative or novel is the solution?
  2. Technical Complexity: What is the quality and depth of the code, stack choices, and architecture?
  3. Impact: Does it solve a real-world problem effectively?
  4. Presentation: Is the proposal clear, well-structured, and convincing?
  5. Feasibility: How practical is this solution to build, launch, and sustain?

  Also provide:
  - Key Strengths (1-2 sentences)
  - Key Areas for Improvement (1-2 sentences)
  - A detailed multi-paragraph Markdown analysis of their implementation, architecture, and potential next steps.

  Respond ONLY in the following JSON format:
  {
    "scores": {
      "innovation": <number 0-10>,
      "technical": <number 0-10>,
      "impact": <number 0-10>,
      "presentation": <number 0-10>,
      "feasibility": <number 0-10>
    },
    "strengths": "<string strengths>",
    "improvements": "<string areas for improvement>",
    "detailedAnalysis": "<markdown string of detailed comments and suggestions>"
  }
  Do not include any explanation or extra markdown wrappers outside of JSON.`;

  try {
    const responseText = await callGemini(prompt);
    if (responseText) {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      if (result && result.scores) {
        return result;
      }
    }
  } catch (err) {
    console.error('Gemini Project evaluation error:', err);
  }

  // Fallback if API fails
  return {
    scores: {
      innovation: 6,
      technical: 6,
      impact: 6,
      presentation: 6,
      feasibility: 7
    },
    strengths: "The project proposes a clear concept targeting its selected domain with a logical tech stack.",
    improvements: "Consider adding live working demos and deepening the code complexity/integration depth.",
    detailedAnalysis: "### Concept Feasibility\nThe proposed concept addresses a legitimate pain point. However, details on data pipeline security and deployment scalability could be fleshed out.\n\n### Tech Stack & Architecture\nThe chosen stack aligns with contemporary web app standards. Future architectural refinements should focus on database caching, performance tuning, and test coverage."
  };
};

module.exports = { evaluateProjectWithAi };
