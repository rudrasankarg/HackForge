const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  inviteCode: { type: String, unique: true },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  maxSize: { type: Number, default: 4 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

teamSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);
