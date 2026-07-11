const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  teamName: { type: String, required: true, trim: true },
  description: { type: String, required: true, maxlength: 3000 },
  techStack: [{ type: String }],
  domain: { type: String, default: '' },
  hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  githubUrl: { type: String, default: '' },
  demoUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'evaluated', 'disqualified'],
    default: 'submitted',
  },
  submittedAt: { type: Date, default: null },
  finalScore: { type: Number, default: null },
  rank: { type: Number, default: null },
  feedback: { type: String, default: '' },
  confidenceScore: { type: Number, default: null },
  isPublished: { type: Boolean, default: false },
  questions: [
    {
      asker: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        role: { type: String, required: true }
      },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      answers: [
        {
          responder: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            name: { type: String, required: true },
            role: { type: String, required: true }
          },
          text: { type: String, required: true },
          createdAt: { type: Date, default: Date.now }
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
