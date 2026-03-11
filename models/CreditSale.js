// This model stores sales where the buyer pays later.
const mongoose = require('mongoose');
const { ALLOWED_PRODUCE } = require('../constants/produce');

const creditSaleSchema = new mongoose.Schema({
  buyerName: {
    type: String,
    required: true,
    minlength: [2, 'Buyer name must be at least 2 characters'],
    match: [/^[a-zA-Z0-9\s]+$/, 'Buyer name must be alpha-numeric'],
    trim: true
  },
  nationalId: {
    type: String,
    required: true,
    match: [/^[A-Z0-9]{14}$/, 'National ID must be a valid NIN format (e.g., 14 alphanumeric chars)'], // Simplified validation
    trim: true
  },
  location: {
    type: String,
    required: true,
    minlength: [2, 'Location must be at least 2 characters'],
    match: [/^[a-zA-Z0-9\s]+$/, 'Location must be alpha-numeric'],
    trim: true
  },
  contact: {
    type: String,
    required: true,
    match: [/^\+?[0-9\s\-]{10,}$/, 'Please enter a valid phone number']
  },
  amountDue: {
    type: Number,
    required: true,
    min: [10000, 'Amount due minimum conceptually 5 digits']
  },
  salesAgent: {
    type: String,
    required: true,
    minlength: [2, 'Sales agent name must be at least 2 characters'],
    match: [/^[a-zA-Z0-9\s]+$/, 'Sales agent must be alpha-numeric'],
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  produceName: {
    type: String,
    required: true,
    minlength: [2, 'Produce name must be at least 2 characters'],
    enum: ALLOWED_PRODUCE,
    trim: true
  },
  produceType: {
    type: String,
    required: true,
    minlength: [2, 'Produce type must be at least 2 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Produce type must contain alphabets only'],
    trim: true
  },
  tonnage: {
    type: Number,
    required: true,
    min: [0.01, 'Tonnage must be greater than 0kg']
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga'],
    required: true
  },
  dispatchDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CreditSale', creditSaleSchema);
