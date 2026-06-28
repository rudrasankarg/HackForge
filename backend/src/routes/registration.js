const router = require('express').Router();
const User = require('../models/User');
const RegistrationLog = require('../models/RegistrationLog');
const { detectDuplicate } = require('../services/ai/duplicateDetection');
const { extractSkills } = require('../services/ai/skillExtractor');

// Intelligent registration endpoint — validates, deduplicates, extracts skills
router.post('/validate', async (req, res) => {
  try {
    const start = Date.now();
    const { name, email, institution, bio } = req.body;

    const existingUsers = await User.find({ role: 'participant' }).select('name email institution');
    const dupResult = await detectDuplicate({ name, email, institution }, existingUsers);
    const skillResult = await extractSkills(bio || '');

    const processingMs = Date.now() - start;

    res.json({
      duplicateCheck: dupResult,
      skillExtraction: skillResult,
      processingMs,
      recommendation: dupResult.isDuplicate
        ? 'FLAGGED — possible duplicate registration detected'
        : 'CLEAR — registration looks valid',
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Log a completed registration
router.post('/log', async (req, res) => {
  try {
    const log = await RegistrationLog.create(req.body);
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all registration logs (admin/organizer)
router.get('/logs', require('../middleware/auth').auth, require('../middleware/auth').requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const logs = await RegistrationLog.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
