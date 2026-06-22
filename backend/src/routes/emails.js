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

module.exports = router;
