const mongoose = require('mongoose');

const aiEvaluationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scores: {
    innovation: { type: Number, min: 0, max: 10, default: 0 },
    technical: { type: Number, min: 0, max: 10, default: 0 },
    impact: { type: Number, min: 0, max: 10, default: 0 },
    presentation: { type: Number, min: 0, max: 10, default: 0 },
    feasibility: { type: Number, min: 0, max: 10, default: 0 },
  },
  totalScore: { type: Number, default: 0 },
  strengths: { type: String, default: '' },
  improvements: { type: String, default: '' },
  detailedAnalysis: { type: String, default: '' },
  sentToTeam: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('AiEvaluation', aiEvaluationSchema);
