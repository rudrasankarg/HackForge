const mongoose = require('mongoose');

const promotionCampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  channel: { type: String, enum: ['email', 'slack', 'twitter', 'linkedin'], required: true },
  subject: { type: String, default: '' },
  contentA: { type: String, required: true },
  contentB: { type: String, default: '' },
  abTestEnabled: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
  audience: { type: String, default: 'all' },
  metrics: {
    sent: { type: Number, default: 0 },
    clicksA: { type: Number, default: 0 },
    clicksB: { type: Number, default: 0 },
    opensA: { type: Number, default: 0 },
    opensB: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('PromotionCampaign', promotionCampaignSchema);
