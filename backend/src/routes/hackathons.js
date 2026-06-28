const router = require('express').Router();
const Hackathon = require('../models/Hackathon');
const { auth, requireRole } = require('../middleware/auth');

// Get all hackathons
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'organizer') {
      filter = { createdBy: req.user._id };
    }
    const hackathons = await Hackathon.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json(hackathons);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single hackathon
router.get('/:id', auth, async (req, res) => {
  try {
    const h = await Hackathon.findById(req.params.id).populate('createdBy', 'name email');
    if (!h) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'organizer' && h.createdBy?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You do not own this hackathon.' });
    }
    res.json(h);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create hackathon
router.post('/', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { registrationDeadline, submissionDeadline } = req.body;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (registrationDeadline && new Date(registrationDeadline) < today) {
      return res.status(400).json({ message: 'Registration deadline cannot be in the past.' });
    }
    if (submissionDeadline && new Date(submissionDeadline) < today) {
      return res.status(400).json({ message: 'Submission deadline cannot be in the past.' });
    }

    const createdBy = (req.user.role === 'admin' && req.body.createdBy) ? req.body.createdBy : req.user._id;
    const hackathon = await Hackathon.create({ ...req.body, createdBy });
    res.status(201).json(hackathon);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update hackathon
router.put('/:id', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { registrationDeadline, submissionDeadline } = req.body;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (registrationDeadline && new Date(registrationDeadline) < today) {
      return res.status(400).json({ message: 'Registration deadline cannot be in the past.' });
    }
    if (submissionDeadline && new Date(submissionDeadline) < today) {
      return res.status(400).json({ message: 'Submission deadline cannot be in the past.' });
    }

    const h = await Hackathon.findById(req.params.id);
    if (!h) return res.status(404).json({ message: 'Hackathon not found.' });
    if (req.user.role === 'organizer' && h.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You do not own this hackathon.' });
    }
    const hackathon = await Hackathon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: false });
    res.json(hackathon);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete hackathon
router.delete('/:id', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const h = await Hackathon.findById(req.params.id);
    if (!h) return res.status(404).json({ message: 'Hackathon not found.' });
    if (req.user.role === 'organizer' && h.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You do not own this hackathon.' });
    }
    await Hackathon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hackathon deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
