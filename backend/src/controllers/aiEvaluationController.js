const Project = require('../models/Project');
const Assignment = require('../models/Assignment');
const AiEvaluation = require('../models/AiEvaluation');
const Hackathon = require('../models/Hackathon');
const { evaluateProjectWithAi } = require('../services/ai/aiEvaluationService');
const { getFairnessCourtVerdict } = require('../services/ai/fairnessCourtService');
const { sendAiEvaluationEmail } = require('../services/emailService');

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


module.exports = {
  runProjectEvaluation,
  getProjectEvaluation,
  sendProjectEvaluationEmail,
  getHackathonFairnessVerdict,
};
