const mongoose = require('mongoose');

const aiJuryDebateSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  transcript: [{
    judge: { type: String, required: true },
    role: { type: String, required: true },
    message: { type: String, required: true },
  }],
  consensusScore: { type: Number, required: true },
  verdictSummary: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('AiJuryDebate', aiJuryDebateSchema);
