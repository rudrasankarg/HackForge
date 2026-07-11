const router = require('express').Router();
const { auth } = require('../middleware/auth');
const PeerReview = require('../models/PeerReview');
router.post('/', auth, async (req, res) => {
  const review = await PeerReview.create(req.body);
  res.status(201).json(review);
});
module.exports = router;