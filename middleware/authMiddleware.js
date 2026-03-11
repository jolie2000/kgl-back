// This file checks login tokens and protects routes by user role.
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');

      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const managerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Manager') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as Manager' });
  }
};

const salesOrManager = (req, res, next) => {
  if (req.user && (req.user.role === 'SalesAgent' || req.user.role === 'Manager')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as Sales Agent or Manager' });
  }
};

const directorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Director') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as Director' });
  }
};

const directorMrOrbanOnly = (req, res, next) => {
  const normalizedName = (req.user?.name || '').trim().toLowerCase();
  if (req.user && req.user.role === 'Director' && normalizedName === 'mr. orban') {
    next();
  } else {
    res.status(403).json({ message: 'Only Director Mr. Orban can access this resource' });
  }
};

module.exports = { protect, managerOnly, salesOrManager, directorOnly, directorMrOrbanOnly };
