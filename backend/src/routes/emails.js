const router = require('express').Router();
const EmailTelemetry = require('../models/EmailTelemetry');
const { auth, requireRole } = require('../middleware/auth');

// 1. Open tracking pixel
router.get('/track/open/:telemetryId', async (req, res) => {
  try {
    const { telemetryId } = req.params;
    const telemetry = await EmailTelemetry.findById(telemetryId);
    if (telemetry) {
      telemetry.openedAt = telemetry.openedAt || new Date();
      if (telemetry.status === 'sent') {
        telemetry.status = 'opened';
      }
      await telemetry.save();
    }
  } catch (err) {
    console.error('Error tracking email open:', err.message);
  }

  // Return a transparent 1x1 GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(pixel);
});

// 2. Click tracking
router.get('/track/click/:telemetryId', async (req, res) => {
  const targetUrl = req.query.url || '/';
  try {
    const { telemetryId } = req.params;
    const telemetry = await EmailTelemetry.findById(telemetryId);
    if (telemetry) {
      telemetry.clickedAt = telemetry.clickedAt || new Date();
      telemetry.status = 'clicked';
      await telemetry.save();
    }
  } catch (err) {
    console.error('Error tracking email click:', err.message);
  }
  res.redirect(targetUrl);
});

// 3. Email analytics endpoint
router.get('/analytics', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const totalSent = await EmailTelemetry.countDocuments();
    const totalOpened = await EmailTelemetry.countDocuments({ status: { $in: ['opened', 'clicked'] } });
    const totalClicked = await EmailTelemetry.countDocuments({ status: 'clicked' });

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    const campaignStats = await EmailTelemetry.aggregate([
      {
        $group: {
          _id: '$campaignType',
          sent: { $sum: 1 },
          opened: { $sum: { $cond: [{ $in: ['$status', ['opened', 'clicked']] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      totalSent,
      totalOpened,
      totalClicked,
      openRate: parseFloat(openRate.toFixed(2)),
      clickRate: parseFloat(clickRate.toFixed(2)),
      campaignStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Retrieve paginated and filtered telemetry logs
router.get('/logs', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const campaignType = req.query.campaignType || '';

    const query = {};
    if (status) query.status = status;
    if (campaignType) query.campaignType = campaignType;
    if (search) {
      query.recipientEmail = { $regex: search, $options: 'i' };
    }

    const total = await EmailTelemetry.countDocuments(query);
    const logs = await EmailTelemetry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Trigger the background campaign engine checks manually
router.post('/trigger-engine', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { runCampaignChecks } = require('../services/emailCampaignService');
    await runCampaignChecks();
    res.json({ message: 'Campaign engine triggered successfully. checked participants and teams.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Send a custom targeted campaign
router.post('/send-custom', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { audience, subject, body } = req.body;
    if (!subject || !body || !audience) {
      return res.status(400).json({ message: 'Audience, subject and body are required.' });
    }

    const User = require('../models/User');
    const Team = require('../models/Team');
    const { sendEmail } = require('../services/emailService');

    let targets = [];

    if (audience === 'all') {
      targets = await User.find({ role: 'participant', isActive: { $ne: false } });
    } else if (audience === 'registered_no_team') {
      const participants = await User.find({ role: 'participant', isActive: { $ne: false } });
      const teams = await Team.find({ isActive: { $ne: false } });
      const userIdsInTeams = new Set();
      teams.forEach(t => {
        if (t.members) {
          t.members.forEach(m => userIdsInTeams.add(m.toString()));
        }
      });
      targets = participants.filter(p => !userIdsInTeams.has(p._id.toString()));
    } else if (audience === 'team_no_submission') {
      const teamsWithNoProject = await Team.find({
        $or: [{ projectId: null }, { projectId: { $exists: false } }],
        isActive: { $ne: false }
      }).populate('members');
      
      const seen = new Set();
      teamsWithNoProject.forEach(t => {
        if (t.members) {
          t.members.forEach(m => {
            if (m && m.email && !seen.has(m.email)) {
              seen.add(m.email);
              targets.push(m);
            }
          });
        }
      });
    } else if (audience === 'reviewer') {
      targets = await User.find({ role: 'reviewer', isActive: { $ne: false } });
    } else if (audience === 'all_users') {
      targets = await User.find({ role: { $in: ['participant', 'reviewer'] }, isActive: { $ne: false } });
    }

    if (targets.length === 0) {
      return res.json({ message: 'No target users found for this audience.', count: 0 });
    }

    // Send emails
    for (const target of targets) {
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
          </div>
          <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
          <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">${subject}</h2>
          <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0; white-space: pre-wrap;">Hello ${target.name || 'Hacker'},\n\n${body}</p>
          <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
          <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge team</p>
        </div>
      `;
      // Send and record telemetry asynchronously (sendEmail does both)
      await sendEmail(target.email, subject, html, 'announcement');
    }

    res.json({ message: `Successfully sent custom campaign to ${targets.length} recipients.`, count: targets.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

