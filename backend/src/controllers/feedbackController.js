const Feedback = require('../models/Feedback');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { hackathonId, type, content, rating, isAnonymous } = req.body;
    if (!hackathonId || !type || !content || !rating)
      return res.status(400).json({ message: 'All fields are required.' });

    const existing = await Feedback.findOne({ userId: req.user._id, hackathonId, type });
    if (existing) return res.status(409).json({ message: 'You have already submitted this type of feedback.' });

    const feedback = await Feedback.create({
      userId: req.user._id, hackathonId, type, content, rating: parseInt(rating), isAnonymous: !!isAnonymous,
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: list all feedback
const listFeedback = async (req, res) => {
  try {
    const { hackathonId, type } = req.query;
    const filter = {};
    if (hackathonId) filter.hackathonId = hackathonId;
    if (type) filter.type = type;

    const feedbacks = await Feedback.find(filter)
      .populate('userId', 'name email institution')
      .sort({ createdAt: -1 });

    const result = feedbacks.map((f) => ({
      ...f.toObject(),
      userId: f.isAnonymous ? { name: 'Anonymous' } : f.userId,
    }));

    const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(2) : 0;

    res.json({ feedbacks: result, total: feedbacks.length, avgRating });
  } catch {
    res.status(500).json({ message: 'Could not load feedback.' });
  }
};

module.exports = { submitFeedback, listFeedback };
