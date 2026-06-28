const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/aiEvaluationController');

// Project evaluation
router.post('/evaluate', auth, requireRole('admin', 'organizer', 'reviewer'), ctrl.runProjectEvaluation);
router.get('/project/:projectId', auth, requireRole('admin', 'organizer', 'reviewer'), ctrl.getProjectEvaluation);
router.post('/project/:projectId/send', auth, requireRole('admin', 'organizer', 'reviewer'), ctrl.sendProjectEvaluationEmail);

// Fairness Court & Jury Debate
router.get('/hackathon/:hackathonId/fairness-court', auth, requireRole('admin', 'organizer'), ctrl.getHackathonFairnessVerdict);
router.post('/project/:projectId/jury-debate', auth, requireRole('admin', 'organizer'), ctrl.runJuryDebateController);
router.get('/project/:projectId/jury-debate', auth, requireRole('admin', 'organizer'), ctrl.getJuryDebateController);

// Cheat Shield (Plagiarism Check)
router.post('/project/cheat-check', auth, requireRole('admin', 'organizer'), ctrl.runCheatShieldController);
router.get('/hackathon/:hackathonId/cheat-shield', auth, requireRole('admin', 'organizer'), ctrl.getCheatShieldLogsController);

// Video Sentiment Analyzer
router.post('/project/video-sentiment', auth, requireRole('admin', 'organizer', 'reviewer'), ctrl.runVideoSentimentController);
router.get('/project/:projectId/video-sentiment', auth, requireRole('admin', 'organizer', 'reviewer'), ctrl.getVideoSentimentController);

module.exports = router;

