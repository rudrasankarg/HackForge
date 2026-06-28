const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/appealController');

// Participant: submit and view own appeals
router.post('/', auth, requireRole('participant'), ctrl.submitAppeal);
router.get('/mine', auth, requireRole('participant'), ctrl.getMyAppeals);

// Admin/Organizer: list and review appeals
router.get('/', auth, requireRole('admin', 'organizer'), ctrl.listAppeals);
router.patch('/:id/review', auth, requireRole('admin', 'organizer'), ctrl.reviewAppeal);

module.exports = router;
