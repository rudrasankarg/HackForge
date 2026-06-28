const mongoose = require('mongoose');

const biasAlertSchema = new mongoose.Schema({
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' },
  dimension: {
    type: String,
    enum: ['gender', 'geographic', 'institutional', 'technology', 'language', 'reviewer-outlier', 'scoring_pattern', 'gender_bias', 'geographic_bias', 'institutional_bias', 'tech_stack_bias'],
    required: true,
  },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  description: { type: String, required: true },
  affectedReviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  affectedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  zScore: { type: Number, default: null },
  statisticalDetail: { type: String, default: '' },
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('BiasAlert', biasAlertSchema);
