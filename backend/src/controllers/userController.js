const User = require('../models/User');

// Get paginated participant list (admin only)
const getParticipants = async (req, res) => {
  try {
    const { search, role, university, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (university) filter.university = { $regex: university, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ message: 'Could not load participants.' });
  }
};

// Get single user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.params.id === 'me' ? req.user._id : req.params.id;

    if (req.params.id !== 'me' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied.' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Could not load profile.' });
  }
};

// Update own profile
const updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'skills', 'domains', 'experience', 'githubUrl', 'linkedinUrl', 'phone', 'demographics', 'university', 'institution', 'preferredLanguage'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Could not update profile.' });
  }
};

// Admin: promote participant to reviewer
const promoteToReviewer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot change admin role.' });

    user.role = req.body.role === 'participant' ? 'participant' : 'reviewer';
    await user.save();
    res.json({ message: `Role updated to ${user.role}.`, user: { _id: user._id, name: user.name, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Could not update role.' });
  }
};

// Admin: deactivate user
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot deactivate admin.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `Account ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch {
    res.status(500).json({ message: 'Could not update user.' });
  }
};

module.exports = { getParticipants, getProfile, updateProfile, promoteToReviewer, deactivateUser };
