const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/teamController');

// Participant team actions
router.post('/', auth, requireRole('participant'), ctrl.createTeam);
router.post('/join', auth, requireRole('participant'), ctrl.joinTeam);
router.get('/mine', auth, requireRole('participant'), ctrl.getMyTeam);
router.delete('/mine/leave', auth, requireRole('participant'), ctrl.leaveTeam);
router.get('/:teamId/suggestions', auth, requireRole('participant'), ctrl.getTeamSuggestions);

// Admin/Organizer: list all teams
router.get('/', auth, requireRole('admin', 'organizer'), ctrl.listTeams);

module.exports = router;
