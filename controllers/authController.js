// This controller handles registering users and logging them in.
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user (Utility for seeding, not necessarily for end-users)
// @route   POST /api/auth/register
// @access  Public (for this project scope)
exports.registerUser = async (req, res) => {
  try {
    const { name, role, branch, password } = req.body;

    if (role === 'Director' && name.trim().toLowerCase() !== 'mr. orban') {
      return res.status(403).json({ message: 'Only Mr. Orban can be registered as Director' });
    }

    // Check if user exists
    const userExists = await User.findOne({ name, role });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      role,
      branch,
      password: hashedPassword
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        role: user.role,
        branch: user.branch,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { name, password, role } = req.body;

    if (role === 'Director' && name.trim().toLowerCase() !== 'mr. orban') {
      return res.status(403).json({ message: 'Only Mr. Orban is authorized as Director' });
    }

    // We use name and role to identify the user for login based on the requirements context
    const user = await User.findOne({ name, role });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        role: user.role,
        branch: user.branch,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', {
    expiresIn: '30d',
  });
};
