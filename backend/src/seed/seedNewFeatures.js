require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const Project = require('../models/Project');
const AiJuryDebate = require('../models/AiJuryDebate');
const CheatShieldLog = require('../models/CheatShieldLog');
const AiVideoSentiment = require('../models/AiVideoSentiment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackforge';

async function seedNewFeatures() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB — appending new feature mock data safely...');

  const projects = await Project.find({});
  if (projects.length === 0) {
    console.log('No existing projects found in database. Please submit or seed projects first.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${projects.length} existing projects. Appending logs...`);

  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];

    // 1. Ensure project has a video URL for testing video sentiment
    if (!proj.videoUrl) {
      proj.videoUrl = i % 2 === 0 
        ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' 
        : 'https://www.youtube.com/watch?v=XH5OW46yFdw';
      await proj.save();
      console.log(`Updated project "${proj.title}" with mock videoUrl.`);
    }

    // 2. Seed Cheat Shield Log (if not already exists)
    const existingCheat = await CheatShieldLog.findOne({ projectId: proj._id });
    if (!existingCheat) {
      let plag = 5 + (i * 12) % 60; 
      let match = 10 + (i * 14) % 70;
      let riskLevel = 'low';
      if (plag > 50 || match > 60) riskLevel = 'high';
      else if (plag > 25 || match > 35) riskLevel = 'medium';

      await CheatShieldLog.create({
        projectId: proj._id,
        hackathonId: proj.hackathonId,
        plagiarismScore: plag,
        boilerplateMatchScore: match,
        matchDetails: plag > 45 
          ? `Code similarity detected with public repository 'react-starter-kit-2024'. Review recommended.`
          : `Starter templates and boilerplate code matching standard configurations. Standard compliance level.`,
        flagged: riskLevel === 'high',
        riskLevel
      });
      console.log(`Created Cheat Shield log for project "${proj.title}".`);
    }

    // 3. Seed Video Sentiment Log (if not already exists)
    const existingVideo = await AiVideoSentiment.findOne({ projectId: proj._id });
    if (!existingVideo && proj.videoUrl) {
      await AiVideoSentiment.create({
        projectId: proj._id,
        videoUrl: proj.videoUrl,
        deliveryScore: 6 + (i * 2) % 5,
        confidenceScore: 5 + (i * 3) % 6,
        pacing: (i % 3 === 0) ? 'slow' : (i % 3 === 1 ? 'balanced' : 'fast'),
        valuePropSummary: `Excellent articulation of the core problem. The pitch details the implementation of ${proj.techStack?.join(', ') || 'technologies'} and targets direct real-world users.`,
        presentationTips: [
          'Maintain better eye contact with the camera.',
          'Slow down slightly during the technical architectural walkthrough.',
          'Clearly specify target market viability.'
        ]
      });
      console.log(`Created Video Sentiment log for project "${proj.title}".`);
    }

    // 4. Seed AI Jury Debate Log (if not already exists)
    const existingDebate = await AiJuryDebate.findOne({ projectId: proj._id });
    if (!existingDebate) {
      await AiJuryDebate.create({
        projectId: proj._id,
        hackathonId: proj.hackathonId,
        transcript: [
          {
            judge: "Dev Dynamo",
            role: "Technical Architect",
            message: `Analyzing the stack chosen for "${proj.title}", the integrations look functionally complete. However, they've implemented a straightforward architecture without substantial backend caching. I'd rate their engineering depth a solid B+.`
          },
          {
            judge: "Pixel Perfect",
            role: "UX/UI Lead",
            message: "I actually appreciate their attention to accessibility. The typography hierarchy is clean, and the dashboard layout is very intuitive. They could improve the micro-interactions, but from a usability perspective, it's highly polished."
          },
          {
            judge: "Venture Vision",
            role: "Business Calibrator",
            message: `From a market standpoint, the value proposition is clear. The feasibility of launching this prototype is high because of low initial infrastructure costs. I agree with Dev Dynamo's note on scaling, but the prototype is highly viable.`
          }
        ],
        consensusScore: 35 + (i % 15),
        verdictSummary: `The jury agrees that "${proj.title}" represents a well-designed, viable solution with solid UX decisions, though it requires further backend optimizations to scale efficiently.`
      });
      console.log(`Created Jury Debate transcript for project "${proj.title}".`);
    }
  }

  console.log('\nSafe Seed complete! Your existing database is intact and updated.');
  await mongoose.disconnect();
}

seedNewFeatures().catch(err => {
  console.error(err);
  process.exit(1);
});
