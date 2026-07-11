const router = require('express').Router();
const { auth } = require('../middleware/auth');
router.post('/analyze-speech', auth, (req, res) => {
  res.json({ pacing: 'balanced', confidenceScore: 88, suggestions: ['Great keyword usage.'] });
});
module.exports = router;