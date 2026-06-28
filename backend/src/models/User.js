const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'organizer', 'reviewer', 'participant'], default: 'participant' },
  companyName: { type: String, default: '', trim: true },
  website: { type: String, default: '', trim: true },
  companyDescription: { type: String, default: '', trim: true },
  employeeId: { type: String, default: '', trim: true },
  idCardImage: { type: String, default: '' },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'approved' },
  aiVerificationScore: { type: Number, default: null },
  aiVerificationNotes: { type: String, default: '' },
  emailVerified: { type: Boolean, default: false },
  institution: { type: String, default: '', trim: true },
  university: { type: String, default: '', trim: true },
  bio: { type: String, default: '', maxlength: 1000 },
  skills: [{ type: String }],
  experience: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
  domains: [{ type: String }],
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  demographics: {
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'], default: 'prefer-not-to-say' },
    country: { type: String, default: '' },
    ageGroup: { type: String, default: '' },
  },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  isActive: { type: Boolean, default: true },
  profileComplete: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
  lastActive: { type: Date, default: Date.now },
  preferredLanguage: { type: String, enum: ['en', 'es', 'fr', 'de', 'hi'], default: 'en' },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
}, { timestamps: true });

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

module.exports = mongoose.model('User', userSchema);
