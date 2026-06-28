const jwt = require('jsonwebtoken');
const User = require('../models/User');

const blacklistedTokens = new Set();

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Authentication required.' });

  const token = header.split(' ')[1];

  if (blacklistedTokens.has(token))
    return res.status(401).json({ message: 'Session expired. Please log in again.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found.' });
    if (!req.user.isActive) return res.status(403).json({ message: 'Account suspended.' });
    req.token = token;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  next();
};

const blacklistToken = (token) => blacklistedTokens.add(token);

module.exports = { auth, requireRole, blacklistToken };
