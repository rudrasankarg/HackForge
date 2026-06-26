const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const EmailTelemetry = require('../models/EmailTelemetry');
const { sendEmail } = require('./emailService');
const { runReassignmentChecks } = require('./ai/reviewerReassignmentService');


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
                <a href="${process.env.CLIENT_ORIGIN || 'https://hackforge-4s9q.onrender.com'}/dashboard" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Find Teammates</a>
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
                  <a href="${process.env.CLIENT_ORIGIN || 'https://hackforge-4s9q.onrender.com'}/dashboard" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Submit Project</a>
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

    // 3. Submission Deadline Approaching Campaign (Warn within last 24 hours)
    try {
      const Hackathon = require('../models/Hackathon');
      const activeHackathons = await Hackathon.find({
        status: { $in: ['active', 'submission', 'registration'] },
        submissionDeadline: { $exists: true, $ne: null }
      });

      const now = new Date();
      for (const hackathon of activeHackathons) {
        const msLeft = new Date(hackathon.submissionDeadline).getTime() - now.getTime();
        const hoursLeft = msLeft / (1000 * 60 * 60);

        if (hoursLeft > 0 && hoursLeft <= 24) {
          console.log(`[CAMPAIGN ENGINE] Hackathon "${hackathon.name}" submission deadline is in ${hoursLeft.toFixed(1)} hours. Dispatching warnings...`);
          
          const submittedTeams = await Team.find({
            hackathonId: hackathon._id,
            projectId: { $ne: null }
          });
          
          const submittedUserIds = new Set();
          submittedTeams.forEach(t => {
            if (t.members) {
              t.members.forEach(m => submittedUserIds.add(m.toString()));
            }
          });

          for (const participant of participants) {
            if (!submittedUserIds.has(participant._id.toString())) {
              const alreadySent = await EmailTelemetry.findOne({
                recipientEmail: participant.email,
                campaignType: 'journey_team_no_submission',
                subject: { $regex: 'URGENT:.*left to submit', $options: 'i' },
                sentAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
              });

              if (!alreadySent) {
                const html = `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="margin-bottom: 24px;">
                      <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
                    </div>
                    <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
                    <h2 style="font-size: 18px; font-weight: 700; color: #b45309; margin: 0 0 12px 0;">Submission Deadline Approaching!</h2>
                    <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">Hello ${participant.name}, the submission deadline for <strong>${hackathon.name}</strong> is approaching quickly! You have less than <strong>${Math.ceil(hoursLeft)} hours</strong> remaining to submit your project.</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 24px;">Make sure your team has filled out the project checklist, linked the GitHub repository, added the demo video, and clicked Submit before the portal closes.</p>
                    <div style="margin-bottom: 24px;">
                      <a href="${process.env.CLIENT_ORIGIN || 'https://hackforge-4s9q.onrender.com'}/dashboard" style="display: inline-block; background-color: #b45309; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Submit Project Now</a>
                    </div>
                    <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
                    <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge team</p>
                  </div>
                `;
                await sendEmail(
                  participant.email,
                  `URGENT: ${Math.ceil(hoursLeft)} hours left to submit for ${hackathon.name}!`,
                  html,
                  'journey_team_no_submission'
                );
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[CAMPAIGN ENGINE ERROR] Failed to run deadline warnings:', err.message);
    }

    // 4. Process Scheduled Email Queue
    try {
      const now = new Date();
      const scheduledEmails = await EmailTelemetry.find({
        status: { $in: ['scheduled', 'scheduled_ab'] },
        sendTimePrediction: { $lte: now }
      });

      if (scheduledEmails.length > 0) {
        console.log(`[CAMPAIGN ENGINE] Processing ${scheduledEmails.length} scheduled emails...`);
        for (const email of scheduledEmails) {
          await sendEmail(
            email.recipientEmail,
            email.subject,
            email.body,
            email.campaignType,
            true // forceImmediate
          );
          await EmailTelemetry.findByIdAndDelete(email._id);
        }
      }
    } catch (err) {
      console.error('[CAMPAIGN ENGINE ERROR] Failed to process scheduled emails:', err.message);
    }

    // 5. Run Reviewer Reassignment checks
    try {
      await runReassignmentChecks();
    } catch (err) {
      console.error('[CAMPAIGN ENGINE ERROR] Failed to run reviewer reassignment checks:', err.message);
    }

    // 6. Daily Promotional Campaign (to promote the website and remind not to unsubscribe)
    try {
      const targetHour = parseInt(process.env.DAILY_PROMO_HOUR) || 12; // default to 12 PM (noon)
      const now = new Date();
      
      // Send if we are at or past the target hour and it hasn't been sent yet today
      if (now.getHours() >= targetHour) {
        // Query to check if any daily_promotion email was sent today (past 12 hours)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const alreadySentToday = await EmailTelemetry.findOne({
          campaignType: 'daily_promotion',
          sentAt: { $gte: startOfToday }
        });

        if (!alreadySentToday) {
          console.log('[CAMPAIGN ENGINE] Sending daily website promotional emails...');
          const activeUsers = await User.find({ isActive: { $ne: false } });
          const clientOrigin = process.env.CLIENT_ORIGIN || 'https://hackforge-4s9q.onrender.com';
          
          for (const targetUser of activeUsers) {
            const html = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="margin-bottom: 24px;">
                  <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
                </div>
                <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
                <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">Build the Future with HackForge!</h2>
                <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">Hello ${targetUser.name || 'Hacker'},</p>
                <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">Discover new opportunities, collaborate with top talent, and build amazing products on HackForge, the ultimate hackathon management platform.</p>
                <div style="margin-bottom: 24px;">
                  <a href="${clientOrigin}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Visit HackForge Now</a>
                </div>
                <p style="font-size: 13px; line-height: 20px; color: #ef4444; font-weight: 600; margin: 0 0 24px 0;">Important: Please do not unsubscribe from these daily updates to ensure you receive crucial announcements and team building requests.</p>
                <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
                <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge team</p>
              </div>
            `;
            // sendEmail(to, subject, html, campaignType, forceImmediate)
            await sendEmail(targetUser.email, 'Promoting Innovation: Join HackForge Today!', html, 'daily_promotion', true);
          }
        }
      }
    } catch (err) {
      console.error('[CAMPAIGN ENGINE ERROR] Failed to run daily promotion:', err.message);
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
