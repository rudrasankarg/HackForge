const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/projectController');

// Get all (role-scoped) or submit project
router.get('/', auth, ctrl.getProjects);
router.get('/:id', auth, ctrl.getProject);
router.post('/submit', auth, requireRole('participant'), ctrl.submitProject);
router.post('/publish', auth, requireRole('admin', 'organizer'), ctrl.publishResults);
router.patch('/:id/status', auth, requireRole('admin', 'organizer'), ctrl.updateStatus);

module.exports = router;
