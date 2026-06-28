const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  confidence: { type: Number, default: 0 },
  expertiseScore: { type: Number, default: 0 },
  workloadScore: { type: Number, default: 0 },
  conflictScore: { type: Number, default: 0 },
  assignedBy: { type: String, enum: ['ai', 'manual'], default: 'ai' },
  status: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' },
}, { timestamps: true });

assignmentSchema.index({ reviewerId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
