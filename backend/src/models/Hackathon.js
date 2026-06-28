const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  theme: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  registrationDeadline: { type: Date },
  submissionDeadline: { type: Date },
  maxParticipants: { type: Number, default: 500 },
  maxTeamSize: { type: Number, default: 4 },
  minTeamSize: { type: Number, default: 2 },
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'registration', 'active', 'submission', 'evaluation', 'completed', 'closed', 'cancelled'],
    default: 'upcoming',
  },
  prizes: { type: String, default: '' },
  rules: { type: String, default: '' },
  registrationOpen: { type: Boolean, default: true },
  resultsPublished: { type: Boolean, default: false },
  allowAppeals: { type: Boolean, default: true },
  evaluationCriteria: [
    {
      name: String,
      weight: Number,
      description: String,
    },
  ],
  prizeDetails: [
    {
      position: Number,
      title: String,
      description: String,
    },
  ],
  faqs: [
    {
      question: String,
      answer: String,
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Hackathon', hackathonSchema);
