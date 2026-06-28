const Evaluation = require('../models/Evaluation');
const Assignment = require('../models/Assignment');
const Project = require('../models/Project');

// Reviewer: get only their assigned projects with evaluation status
const getAssignedProjects = async (req, res) => {
  try {
    const assignments = await Assignment.find({ reviewerId: req.user._id })
      .populate({ path: 'projectId', populate: { path: 'teamMembers', select: 'name institution' } });

    const result = await Promise.all(
      assignments.map(async (a) => {
        const evaluation = await Evaluation.findOne({ reviewerId: req.user._id, projectId: a.projectId?._id });
        return {
          assignment: a,
          project: a.projectId,
          evaluation: evaluation || null,
          evaluated: !!evaluation && evaluation.status === 'completed',
        };
      })
    );

    res.json(result);
  } catch {
    res.status(500).json({ message: 'Could not load assignments.' });
  }
};

// Submit evaluation — reviewer must be assigned to this project
const submitEvaluation = async (req, res) => {
  try {
    const { projectId, scores, feedback, hackathonId } = req.body;

    const assignment = await Assignment.findOne({ reviewerId: req.user._id, projectId });
    if (!assignment) return res.status(403).json({ message: 'You are not assigned to this project.' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const existing = await Evaluation.findOne({ reviewerId: req.user._id, projectId });
    if (existing && existing.status === 'completed')
      return res.status(409).json({ message: 'You have already submitted an evaluation for this project.' });

    const totalScore = scores ? Object.values(scores).reduce((a, b) => a + b, 0) : 0;

    const evaluation = existing
      ? Object.assign(existing, { scores, totalScore, feedback, status: 'completed', submittedAt: new Date() })
      : new Evaluation({ projectId, reviewerId: req.user._id, hackathonId, scores, totalScore, feedback, status: 'completed', submittedAt: new Date() });

    await evaluation.save();
    assignment.status = 'completed';
    await assignment.save();

    try {
      await runReviewerBiasChecks(hackathonId, req.user._id, evaluation._id);
    } catch (biasErr) {
      console.error('Error running bias analysis on submission:', biasErr);
    }

    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get all evaluations for a project
const getProjectEvaluations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const evaluations = await Evaluation.find({ projectId })
      .populate('reviewerId', 'name email institution')
      .sort({ submittedAt: -1 });
    res.json(evaluations);
  } catch {
    res.status(500).json({ message: 'Could not load evaluations.' });
  }
};

// Admin or reviewer: get all evaluations (admin: all, reviewer: own)
const getEvaluations = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { reviewerId: req.user._id };
    const evals = await Evaluation.find(filter)
      .populate('projectId', 'title teamName')
      .populate('reviewerId', 'name email')
      .sort({ submittedAt: -1 });
    res.json(evals);
  } catch {
    res.status(500).json({ message: 'Could not load evaluations.' });
  }
};

const { zScore, runReviewerBiasChecks, previewBiasWarnings } = require('../services/ai/biasDetector');

// Check pre-submission scoring anomaly
const checkPreSubmitBias = async (req, res) => {
  try {
    const { projectId, score } = req.body;
    const reviewerId = req.user._id;

    if (!projectId || score === undefined) {
      return res.status(400).json({ message: 'projectId and score are required.' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const hackathonId = project.hackathonId;

    const result = await previewBiasWarnings(hackathonId, reviewerId, projectId, score);
    
    // For backward compatibility:
    const scoringWarning = result.warnings.find(w => w.type === 'scoring_pattern');
    const z = scoringWarning ? scoringWarning.zScore : 0;
    const warningMessage = scoringWarning ? scoringWarning.message : '';
    const warning = result.hasBiasWarning; 
    const biasType = scoringWarning ? 'scoring_pattern' : 'none';

    res.json({
      hasBiasWarning: result.hasBiasWarning,
      warnings: result.warnings,
      warning,
      zScore: z ? parseFloat(z.toFixed(2)) : 0,
      message: warningMessage,
      warningMessage,
      biasType
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  getAssignedProjects, 
  submitEvaluation, 
  getProjectEvaluations, 
  getEvaluations,
  checkPreSubmitBias
};
