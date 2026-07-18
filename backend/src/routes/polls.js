const router = require('express').Router();
const { auth } = require('../middleware/auth');

router.post('/vote', auth, async (req, res) => {
  const { pollId, optionId } = req.body;
  res.json({ success: true, message: 'Vote registered.' });
});
module.exports = router;