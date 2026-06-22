const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const EmailTelemetry = require('../models/EmailTelemetry');
const { sendEmail } = require('./emailService');

// Perform the journey status check for all users/teams and dispatch emails
const runCampaignChecks = async () => {
  try {
    console.log('[CAMPAIGN ENGINE] Starting stage-based checks...');

    // 1. Registered, No Team Campaign
    const participants = await User.find({ role: 'participant', isActive: { $ne: false } });
    const teams = await Team.find({ isActive: { $ne: false } });

    const userIdsInTeams = new Set();
    teams.forEach(team => {
      if (team.members && Array.isArray(team.members)) {
        team.members.forEach(memberId => userIdsInTeams.add(memberId.toString()));
      }
    });

    for (const participant of participants) {
      if (!userIdsInTeams.has(participant._id.toString())) {
        // Participant has no team!
        // Check if we already sent this email in the last 3 days
        const alreadySent = await EmailTelemetry.findOne({
          recipientEmail: participant.email,
          campaignType: 'journey_registered_no_team',
          sentAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        });

        if (!alreadySent) {
          const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff;">
              <div style="margin-bottom: 24px;">
                <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
              </div>
              <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
              <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">Find Your Dream Team!</h2>
              <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">Hello ${participant.name}, we noticed you haven't joined or created a team yet. Teams with complementary skills have a much higher rate of success! Log in to find teammates or create a new team.</p>
              <div style="margin-bottom: 24px;">
                <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Find Teammates</a>
              </div>
              <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
              <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge team</p>
            </div>
          `;
          await sendEmail(participant.email, 'HackForge — Form or Join a Team Now!', html, 'journey_registered_no_team');
        }
      }
    }

    // 2. Has Team, No Submission Campaign
    const teamsWithNoProject = await Team.find({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } }
      ],
      isActive: { $ne: false }
    }).populate('members', 'name email');

    for (const team of teamsWithNoProject) {
      if (team.members && team.members.length > 0) {
        for (const member of team.members) {
          const alreadySent = await EmailTelemetry.findOne({
            recipientEmail: member.email,
            campaignType: 'journey_team_no_submission',
            sentAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
          });

          if (!alreadySent) {
            const html = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff;">
                <div style="margin-bottom: 24px;">
                  <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
                </div>
                <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
                <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">Submit Your Project Checklist</h2>
                <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">Hello ${member.name}, your team <strong>${team.name}</strong> has not submitted a project yet. Make sure to complete your codebase, prepare your GitHub URL, record a short demo video, and submit your project before the deadline!</p>
                <div style="margin-bottom: 24px;">
                  <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Submit Project</a>
                </div>
                <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
                <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge team</p>
              </div>
            `;
            await sendEmail(member.email, 'HackForge — Don\'t forget to submit your project!', html, 'journey_team_no_submission');
          }
        }
      }
    }

    console.log('[CAMPAIGN ENGINE] Completed stage-based checks successfully.');
  } catch (err) {
    console.error('[CAMPAIGN ENGINE ERROR] Failed to run checks:', err.message);
  }
};

// Start the background campaign scheduler (runs every 30 minutes)
const startCampaignService = () => {
  // Run once on startup (with 10-second delay to avoid database connection races)
  setTimeout(runCampaignChecks, 10000);

  // Set interval of 30 minutes
  setInterval(runCampaignChecks, 30 * 60 * 1000);
};

module.exports = { startCampaignService, runCampaignChecks };
