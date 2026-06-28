const Project = require('../models/Project');
const Assignment = require('../models/Assignment');
const AiEvaluation = require('../models/AiEvaluation');
const Hackathon = require('../models/Hackathon');
const Evaluation = require('../models/Evaluation');
const AiJuryDebate = require('../models/AiJuryDebate');
const CheatShieldLog = require('../models/CheatShieldLog');
const AiVideoSentiment = require('../models/AiVideoSentiment');
const { evaluateProjectWithAi } = require('../services/ai/aiEvaluationService');
const { getFairnessCourtVerdict } = require('../services/ai/fairnessCourtService');
const { sendAiEvaluationEmail } = require('../services/emailService');
const { runJuryDebate } = require('../services/ai/juryDebateService');
const { scanProjectPlagiarism } = require('../services/ai/cheatShieldService');
const { analyzePitchVideo } = require('../services/ai/videoSentimentService');


const verifyAccess = async (req, projectId) => {
  const project = await Project.findById(projectId).populate('teamMembers');
  if (!project) throw new Error('Project not found');

  if (req.user.role === 'reviewer') {
    const assignment = await Assignment.findOne({ reviewerId: req.user._id, projectId });
    if (!assignment) throw new Error('Unauthorized: You are not assigned to this project');
  }

  if (req.user.role === 'organizer') {
    const hackathon = await Hackathon.findById(project.hackathonId);
    if (!hackathon || hackathon.createdBy?.toString() !== req.user._id.toString()) {
      throw new Error('Unauthorized: You do not own the hackathon associated with this project');
    }
  }
  return project;
};


// Run AI evaluation on project
const runProjectEvaluation = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await verifyAccess(req, projectId);

    const evaluationResult = await evaluateProjectWithAi(project);

    const totalScore = Object.values(evaluationResult.scores).reduce((a, b) => a + b, 0);

    let evaluation = await AiEvaluation.findOne({ projectId });
    if (evaluation) {
      Object.assign(evaluation, {
        evaluatorId: req.user._id,
        scores: evaluationResult.scores,
        totalScore,
        strengths: evaluationResult.strengths,
        improvements: evaluationResult.improvements,
        detailedAnalysis: evaluationResult.detailedAnalysis,
      });
    } else {
      evaluation = new AiEvaluation({
        projectId,
        evaluatorId: req.user._id,
        scores: evaluationResult.scores,
        totalScore,
        strengths: evaluationResult.strengths,
        improvements: evaluationResult.improvements,
        detailedAnalysis: evaluationResult.detailedAnalysis,
      });
    }

    await evaluation.save();
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get AI evaluation of project
const getProjectEvaluation = async (req, res) => {
  try {
    const { projectId } = req.params;
    await verifyAccess(req, projectId);

    const evaluation = await AiEvaluation.findOne({ projectId });
    if (!evaluation) {
      return res.status(404).json({ message: 'AI evaluation not found for this project yet.' });
    }
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send AI evaluation email report to project team
const sendProjectEvaluationEmail = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await verifyAccess(req, projectId);

    const evaluation = await AiEvaluation.findOne({ projectId });
    if (!evaluation) {
      return res.status(404).json({ message: 'Please run AI evaluation first before sending.' });
    }

    // Gather team member emails
    const emails = project.teamMembers?.map(m => m.email).filter(Boolean) || [];
    if (emails.length === 0) {
      return res.status(400).json({ message: 'No team member email addresses found to send the report.' });
    }

    for (const email of emails) {
      await sendAiEvaluationEmail(
        email,
        project.teamName,
        project.title,
        evaluation.scores,
        evaluation.strengths,
        evaluation.improvements,
        evaluation.detailedAnalysis
      );
    }

    evaluation.sentToTeam = true;
    await evaluation.save();

    res.json({ message: `AI evaluation email sent successfully to ${emails.length} team members.`, evaluation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get AI Fairness Court verdict
// Get AI Fairness Court verdict
const getHackathonFairnessVerdict = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    if (req.user.role === 'organizer') {
      const hackathon = await Hackathon.findById(hackathonId);
      if (!hackathon || hackathon.createdBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You do not own this hackathon.' });
      }
    }

    const result = await getFairnessCourtVerdict(hackathonId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const runJuryDebateController = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const project = await verifyAccess(req, projectId);
    const evaluations = await Evaluation.find({ projectId, status: 'completed' });
    const result = await runJuryDebate(project, evaluations);
    
    let debate = await AiJuryDebate.findOne({ projectId });
    if (debate) {
      Object.assign(debate, {
        transcript: result.transcript,
        consensusScore: result.consensusScore,
        verdictSummary: result.verdictSummary
      });
    } else {
      debate = new AiJuryDebate({
        projectId,
        hackathonId: project.hackathonId,
        transcript: result.transcript,
        consensusScore: result.consensusScore,
        verdictSummary: result.verdictSummary
      });
    }
    await debate.save();
    res.json(debate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getJuryDebateController = async (req, res) => {
  try {
    const { projectId } = req.params;
    await verifyAccess(req, projectId);
    const debate = await AiJuryDebate.findOne({ projectId });
    if (!debate) return res.status(404).json({ message: 'No jury debate found for this project yet.' });
    res.json(debate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const runCheatShieldController = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await verifyAccess(req, projectId);
    const result = await scanProjectPlagiarism(project);
    
    let log = await CheatShieldLog.findOne({ projectId });
    if (log) {
      Object.assign(log, {
        plagiarismScore: result.plagiarismScore,
        boilerplateMatchScore: result.boilerplateMatchScore,
        matchDetails: result.matchDetails,
        flagged: result.flagged,
        riskLevel: result.riskLevel
      });
    } else {
      log = new CheatShieldLog({
        projectId,
        hackathonId: project.hackathonId,
        plagiarismScore: result.plagiarismScore,
        boilerplateMatchScore: result.boilerplateMatchScore,
        matchDetails: result.matchDetails,
        flagged: result.flagged,
        riskLevel: result.riskLevel
      });
    }
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCheatShieldLogsController = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    if (req.user.role === 'organizer') {
      const hackathon = await Hackathon.findById(hackathonId);
      if (!hackathon || hackathon.createdBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You do not own this hackathon.' });
      }
    }
    const logs = await CheatShieldLog.find({ hackathonId }).populate('projectId', 'title teamName githubUrl techStack');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const runVideoSentimentController = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await verifyAccess(req, projectId);
    if (!project.videoUrl) return res.status(400).json({ message: 'Project has no presentation video URL.' });
    
    const result = await analyzePitchVideo(project);
    let sentiment = await AiVideoSentiment.findOne({ projectId });
    if (sentiment) {
      Object.assign(sentiment, {
        deliveryScore: result.deliveryScore,
        confidenceScore: result.confidenceScore,
        pacing: result.pacing,
        valuePropSummary: result.valuePropSummary,
        presentationTips: result.presentationTips
      });
    } else {
      sentiment = new AiVideoSentiment({
        projectId,
        videoUrl: project.videoUrl,
        deliveryScore: result.deliveryScore,
        confidenceScore: result.confidenceScore,
        pacing: result.pacing,
        valuePropSummary: result.valuePropSummary,
        presentationTips: result.presentationTips
      });
    }
    await sentiment.save();
    res.json(sentiment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVideoSentimentController = async (req, res) => {
  try {
    const { projectId } = req.params;
    await verifyAccess(req, projectId);
    const sentiment = await AiVideoSentiment.findOne({ projectId });
    if (!sentiment) return res.status(404).json({ message: 'No video analysis found for this project yet.' });
    res.json(sentiment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  runProjectEvaluation,
  getProjectEvaluation,
  sendProjectEvaluationEmail,
  getHackathonFairnessVerdict,
  runJuryDebateController,
  getJuryDebateController,
  runCheatShieldController,
  getCheatShieldLogsController,
  runVideoSentimentController,
  getVideoSentimentController,
};

