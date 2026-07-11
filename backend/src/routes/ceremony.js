const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
router.get('/presentation-data', auth, requireRole('admin', 'organizer'), (req, res) => {
  res.json({ livePollResults: [45, 30, 25], totalSubmissions: 42 });
});
module.exports = router;