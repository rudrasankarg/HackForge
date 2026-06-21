const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: false },
  subject: { type: String, required: true, trim: true },
  category: { type: String, enum: ['technical', 'logistics', 'judging', 'other'], default: 'technical' },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  replies: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      senderName: { type: String },
      senderRole: { type: String },
      body: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
