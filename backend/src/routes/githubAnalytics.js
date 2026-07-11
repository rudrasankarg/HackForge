const router = require('express').Router();
const { auth } = require('../middleware/auth');
router.get('/:teamId', auth, async (req, res) => {
  res.json({
    commits: [
      { author: 'Aarav', count: 18, additions: 450, deletions: 120 },
      { author: 'Zara', count: 12, additions: 310, deletions: 45 }
    ]
  });
});
module.exports = router;