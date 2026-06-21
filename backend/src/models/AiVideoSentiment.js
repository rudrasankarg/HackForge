const mongoose = require('mongoose');

const aiVideoSentimentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  videoUrl: { type: String, required: true },
  deliveryScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },
  pacing: { type: String, default: 'balanced' }, // slow, balanced, fast
  valuePropSummary: { type: String, default: '' },
  presentationTips: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('AiVideoSentiment', aiVideoSentimentSchema);
