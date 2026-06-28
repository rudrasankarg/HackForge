const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  type: { type: String, enum: ['platform', 'evaluation', 'organisation', 'general'], required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  rating: { type: Number, min: 1, max: 5, required: true },
  isAnonymous: { type: Boolean, default: false },
}, { timestamps: true });

feedbackSchema.index({ userId: 1, hackathonId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
