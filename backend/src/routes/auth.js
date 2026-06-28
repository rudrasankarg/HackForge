const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/authController');
const { validateUniversity, getAllUniversities } = require('../services/universityValidator');

const { authLimiter } = require('../middleware/rateLimiter');

// OTP flow
router.post('/send-otp', authLimiter, ctrl.sendOtp);
router.post('/verify-otp', authLimiter, ctrl.verifyOtp);

// Registration and login
router.post('/register', authLimiter, ctrl.register);
router.post('/register-organizer', authLimiter, ctrl.registerOrganizer);
router.post('/login', authLimiter, ctrl.login);
router.post('/admin/login', authLimiter, ctrl.adminLogin);
router.post('/organizer/login', authLimiter, ctrl.organizerLogin);

// Logout
router.post('/logout', auth, ctrl.logout);

// Current user
router.get('/me', auth, ctrl.me);

// University validation
router.get('/universities', (_req, res) => res.json(getAllUniversities()));
router.post('/validate-university', async (req, res) => {
  const result = await validateUniversity(req.body.university);
  res.json(result);
});

module.exports = router;
