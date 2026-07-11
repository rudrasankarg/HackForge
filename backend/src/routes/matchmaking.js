const router = require('express').Router();
const MatchmakingPost = require('../models/MatchmakingPost');
const Team = require('../models/Team');
const { auth } = require('../middleware/auth');

// Get all matchmaking posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await MatchmakingPost.find()
      .populate('user', 'name email skills bio')
      .populate('team', 'name members')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a matchmaking post
router.post('/', auth, async (req, res) => {
  try {
    const { type, message, skills, title } = req.body;
    let teamId = null;

    if (type === 'team') {
      const team = await Team.findOne({ members: req.user._id });
      if (!team) {
        return res.status(400).json({ error: 'You are not in a team to recruit members for.' });
      }
      teamId = team._id;
    }

    const post = new MatchmakingPost({
      type,
      user: req.user._id,
      team: teamId,
      message,
      skills: skills || [],
      title: title || (type === 'team' ? 'Looking for Teammates' : 'Looking for a Team')
    });

    await post.save();
    
    const populated = await post.populate([
      { path: 'user', select: 'name email skills bio' },
      { path: 'team', select: 'name members' }
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await MatchmakingPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only creator or admin can delete
    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await MatchmakingPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
