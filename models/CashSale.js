// This model stores cash sales made by sales agents or managers.
const mongoose = require('mongoose');
const { ALLOWED_PRODUCE } = require('../constants/produce');

const cashSaleSchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true,
    enum: ALLOWED_PRODUCE,
    trim: true
  },
  tonnage: {
    type: Number,
    required: true,
    min: [0.01, 'Tonnage must be greater than 0kg']
  },
  amountPaid: {
    type: Number,
    required: true,
    min: [10000, 'Amount paid minimum conceptually 5 digits']
  },
  buyerName: {
    type: String,
    required: true,
    minlength: [2, 'Buyer name must be at least 2 characters long'],
    match: [/^[a-zA-Z0-9\s]+$/, 'Buyer name must be alpha-numeric'],
    trim: true
  },
  salesAgent: {
    type: String,
    required: true,
    minlength: [2, 'Sales agent name must be at least 2 characters'],
    match: [/^[a-zA-Z0-9\s]+$/, 'Sales agent must be alpha-numeric'],
    trim: true
  },
  dateTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CashSale', cashSaleSchema);
