const mongoose = require('mongoose');

const emailTelemetrySchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true },
  subject: { type: String, required: true },
  campaignType: {
    type: String,
    enum: [
      'welcome',
      'otp',
      'result',
      'announcement',
      'journey_registered_no_team',
      'journey_team_no_submission',
      'journey_submitted',
      'journey_evaluation_complete',
      'journey_post_event'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'opened', 'clicked'],
    default: 'sent'
  },
  openedAt: { type: Date, default: null },
  clickedAt: { type: Date, default: null },
  sendTimePrediction: { type: Date, default: null },
  sentAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('EmailTelemetry', emailTelemetrySchema);
