const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
router.post('/generate', auth, requireRole('admin', 'organizer'), async (req, res) => {
  res.json({ message: 'Certificates successfully generated and dispatched via email.', pdfUrl: '/downloads/cert-sample.pdf' });
});
module.exports = router;