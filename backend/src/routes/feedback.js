const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/feedbackController');

// Participant: submit feedback
router.post('/', auth, requireRole('participant'), ctrl.submitFeedback);

// Admin/Organizer: view all feedback
router.get('/', auth, requireRole('admin', 'organizer'), ctrl.listFeedback);

module.exports = router;
