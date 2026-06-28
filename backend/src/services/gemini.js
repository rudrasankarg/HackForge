const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getModel = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') return null;
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

const callGemini = async (prompt, imagePart = null) => {
  const model = getModel();
  if (!model) return null;

  let retries = 3;
  let delay = 500;

  const contentParts = [prompt];
  if (imagePart) {
    contentParts.push(imagePart);
  }

  while (retries > 0) {
    try {
      const result = await model.generateContent(contentParts);
      return result.response.text();
    } catch (err) {
      console.error(`Gemini attempt failed (retries left: ${retries - 1}):`, err.message);
      retries -= 1;
      if (retries === 0) return null;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }
  return null;
};

module.exports = { callGemini };
