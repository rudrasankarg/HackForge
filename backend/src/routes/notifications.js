const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
router.get('/', auth, async (req, res) => {
  const notifications = await Notification.find({ recipientId: req.user._id });
  res.json(notifications);
});
module.exports = router;