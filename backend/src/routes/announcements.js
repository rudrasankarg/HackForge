const router = require('express').Router();
const Announcement = require('../models/Announcement');
const { auth, requireRole } = require('../middleware/auth');

// Get announcements (role-scoped)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.hackathonId) filter.hackathonId = req.query.hackathonId;
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      filter.$or = [{ targetRole: 'all' }, { targetRole: req.user.role }];
    }
    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name')
      .sort({ pinned: -1, createdAt: -1 });
    res.json(announcements);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create announcement (admin / organizer only)
router.post('/', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { title, body, targetRole, hackathonId, pinned, type } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required.' });
    const ann = await Announcement.create({ title, body, targetRole: targetRole || 'all', hackathonId, pinned: !!pinned, type: type || 'info', createdBy: req.user._id });
    
    req.io?.emit('new-announcement', ann);

    // Send email notification to all matching users in background
    const User = require('../models/User');
    const emailFilter = { isActive: { $ne: false } };
    if (targetRole && targetRole !== 'all') {
      emailFilter.role = targetRole;
    } else {
      emailFilter.role = { $in: ['participant', 'reviewer'] };
    }

    User.find(emailFilter).then(targetUsers => {
      const { sendEmail } = require('../services/emailService');
      for (const u of targetUsers) {
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge Announcement</span>
            </div>
            <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
            <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">${title}</h2>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">Posted on ${new Date().toLocaleDateString()}</p>
            <div style="font-size: 15px; line-height: 24px; color: #374151; margin-bottom: 24px;">
              ${body}
            </div>
            <div style="margin-bottom: 24px;">
              <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">View on HackForge</a>
            </div>
            <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
            <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">You are receiving this because you are registered for this event on HackForge.</p>
          </div>
        `;
        sendEmail(u.email, `HackForge Announcement: ${title}`, html, 'announcement').catch(e => console.error('Failed to send announcement email:', e.message));
      }
    }).catch(err => console.error('Failed to retrieve users for announcement notification:', err.message));

    res.status(201).json(ann);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update announcement (admin / organizer only)
router.put('/:id', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ann);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete announcement (admin / organizer only)
router.delete('/:id', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
