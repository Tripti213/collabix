const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redis = require('../config/redis');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    // Check if token is blacklisted (logged out)
    const blacklisted = await redis.isTokenBlacklisted(token);
    if (blacklisted) return res.status(401).json({ message: 'Token has been invalidated. Please login again.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Try cache first
    const cacheKey = `user:${decoded.id}`;
    let userData = await redis.get(cacheKey);

    if (!userData) {
      userData = await User.findById(decoded.id).select('-password').lean();
      if (!userData) return res.status(401).json({ message: 'User not found' });
      // Cache for 5 minutes
      await redis.set(cacheKey, userData, 300);
    }

    req.user = userData;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;