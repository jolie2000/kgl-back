// This model stores stock alerts sent to managers.
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['OUT_OF_STOCK', 'LOW_STOCK'],
    required: true
  },
  produceName: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
