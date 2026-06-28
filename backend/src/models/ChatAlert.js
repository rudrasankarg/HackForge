const mongoose = require('mongoose');

const chatAlertSchema = new mongoose.Schema({
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamName: { type: String },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String },
  messageBody: { type: String },
  reason: { type: String, default: 'Potential malicious or dangerous comment detected' },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ChatAlert', chatAlertSchema);
