const router = require('express').Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// List all company organizer applications (Admin only)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' }).sort({ createdAt: -1 });
    res.json(organizers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve a company organizer application (Admin only)
router.post('/:id/approve', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'organizer') {
      return res.status(404).json({ message: 'Organizer application not found.' });
    }
    user.verificationStatus = 'approved';
    await user.save();
    res.json({ message: `Organizer ${user.companyName} has been approved.`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject a company organizer application (Admin only)
router.post('/:id/reject', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'organizer') {
      return res.status(404).json({ message: 'Organizer application not found.' });
    }
    user.verificationStatus = 'rejected';
    await user.save();
    res.json({ message: `Organizer ${user.companyName} has been rejected.`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Suspend an organizer (Admin only)
router.post('/:id/suspend', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'organizer') {
      return res.status(404).json({ message: 'Organizer not found.' });
    }
    user.verificationStatus = 'suspended';
    user.isActive = false;
    await user.save();
    res.json({ message: `Organizer ${user.companyName} has been suspended.`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unsuspend an organizer (Admin only)
router.post('/:id/unsuspend', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'organizer') {
      return res.status(404).json({ message: 'Organizer not found.' });
    }
    user.verificationStatus = 'approved';
    user.isActive = true;
    await user.save();
    res.json({ message: `Organizer ${user.companyName} has been activated.`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
