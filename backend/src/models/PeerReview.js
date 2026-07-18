const mongoose = require('mongoose');

const peerReviewSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  feedback: { type: String, required: true },
  rating: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('PeerReview', peerReviewSchema);
