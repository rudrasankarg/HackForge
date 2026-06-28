const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

// User self-service
router.get('/me', auth, ctrl.getProfile);
router.patch('/me', auth, ctrl.updateProfile);

// Admin/Organizer
router.get('/', auth, requireRole('admin', 'organizer'), ctrl.getParticipants);
router.get('/:id', auth, requireRole('admin', 'organizer'), ctrl.getProfile);
router.patch('/:id/role', auth, requireRole('admin', 'organizer'), ctrl.promoteToReviewer);
router.patch('/:id/status', auth, requireRole('admin', 'organizer'), ctrl.deactivateUser);

module.exports = router;
