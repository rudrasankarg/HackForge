const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/evaluationController');

// Reviewer/Admin/Organizer: assigned projects + submit evaluation
router.get('/assigned', auth, requireRole('reviewer', 'admin', 'organizer'), ctrl.getAssignedProjects);
router.post('/', auth, requireRole('reviewer'), ctrl.submitEvaluation);
router.post('/check-bias', auth, requireRole('reviewer'), ctrl.checkPreSubmitBias);

// Admin/Organizer: all evaluations or per-project
router.get('/', auth, requireRole('admin', 'reviewer', 'organizer'), ctrl.getEvaluations);
router.get('/project/:projectId', auth, requireRole('admin', 'organizer'), ctrl.getProjectEvaluations);

module.exports = router;
