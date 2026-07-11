const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Sponsor = require('../models/Sponsor');
router.get('/', auth, async (req, res) => {
  const sponsors = await Sponsor.find();
  res.json(sponsors);
});
module.exports = router;