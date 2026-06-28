const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String },
  senderRole: { type: String },
  body: { type: String, required: true },
  room: { type: String, default: 'general' },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' },
  aiGenerated: { type: Boolean, default: false },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
