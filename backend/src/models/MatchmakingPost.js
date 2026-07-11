const mongoose = require('mongoose');

const matchmakingPostSchema = new mongoose.Schema({
  type: { type: String, enum: ['participant', 'team'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  skills: [{ type: String }],
  title: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('MatchmakingPost', matchmakingPostSchema);
