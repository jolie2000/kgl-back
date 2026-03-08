const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unque: true,
  },
  role: {
    type: String,
    enum: ['Manager', 'SalesAgent', 'Director'],
    required: true,
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga', 'All'],
    required: true,
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
