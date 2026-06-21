const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/aiEvaluationController');

// Project evaluation
router.post('/evaluate', auth, requireRole('admin', 'organizer', 'reviewer'), ctrl.runProjectEvaluation);
router.get('/project/:projectId', auth, requireRole('admin', 'organizer', 'reviewer'), ctrl.getProjectEvaluation);
router.post('/project/:projectId/send', auth, requireRole('admin', 'organizer', 'reviewer'), ctrl.sendProjectEvaluationEmail);

// Fairness Court
router.get('/hackathon/:hackathonId/fairness-court', auth, requireRole('admin', 'organizer'), ctrl.getHackathonFairnessVerdict);

module.exports = router;
