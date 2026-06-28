const mongoose = require('mongoose');

const registrationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String },
  duplicateScore: { type: Number, default: 0 },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  skillsExtracted: [{ type: String }],
  domainsExtracted: [{ type: String }],
  experienceClassified: { type: String, default: '' },
  processingMs: { type: Number, default: 0 },
  aiProcessed: { type: Boolean, default: true },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('RegistrationLog', registrationLogSchema);
