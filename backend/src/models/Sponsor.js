const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String },
  tier: { type: String, enum: ['gold', 'silver', 'bronze', 'partner'] },
  website: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Sponsor', sponsorSchema);
