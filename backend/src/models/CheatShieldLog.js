const mongoose = require('mongoose');

const cheatShieldLogSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  plagiarismScore: { type: Number, default: 0 },
  boilerplateMatchScore: { type: Number, default: 0 },
  matchDetails: { type: String, default: '' },
  flagged: { type: Boolean, default: false },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
}, { timestamps: true });

module.exports = mongoose.model('CheatShieldLog', cheatShieldLogSchema);
