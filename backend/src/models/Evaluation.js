const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  scores: {
    innovation: { type: Number, min: 0, max: 10 },
    technical: { type: Number, min: 0, max: 10 },
    impact: { type: Number, min: 0, max: 10 },
    presentation: { type: Number, min: 0, max: 10 },
    feasibility: { type: Number, min: 0, max: 10 },
  },
  totalScore: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  strengths: { type: String, default: '' },
  improvements: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  submittedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);
