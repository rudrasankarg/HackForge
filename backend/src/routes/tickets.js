const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ticketController');

// All ticket routes require authentication
router.use(auth);

router.post('/', ctrl.createTicket);
router.get('/', ctrl.getTickets);
router.get('/:id', ctrl.getTicket);
router.post('/:id/reply', ctrl.replyTicket);
router.patch('/:id/status', requireRole('admin', 'organizer', 'reviewer'), ctrl.updateTicketStatus);

module.exports = router;
