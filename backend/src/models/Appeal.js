const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema({
  participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  reason: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'under_review', 'accepted', 'dismissed'], default: 'pending' },
  adminNote: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

appealSchema.index({ participantId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('Appeal', appealSchema);
