const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  targetRole: { type: String, enum: ['all', 'participant', 'reviewer', 'admin'], default: 'all' },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pinned: { type: Boolean, default: false },
  type: { type: String, enum: ['info', 'warning', 'success', 'urgent'], default: 'info' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
