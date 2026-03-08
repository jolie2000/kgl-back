const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true,
    match: [/^[a-zA-Z0-9\s]+$/, 'Produce name must be alpha-numeric'],
    trim: true
  },
  produceType: {
    type: String,
    required: true,
    minlength: [2, 'Produce type must be at least 2 characters long'],
    match: [/^[a-zA-Z\s]+$/, 'Produce type must contain alphabets only'],
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  tonnage: {
    type: Number,
    required: true,
    min: [100, 'Tonnage minimum length conceptually equivalent to 3 chars']
  },
  cost: {
    type: Number,
    required: true,
    min: [10000, 'Cost minimum length conceptually equivalent to 5 chars']
  },
  dealerName: {
    type: String,
    required: true,
    minlength: [2, 'Dealer name must be at least 2 characters'],
    match: [/^[a-zA-Z0-9\s]+$/, 'Dealer name must be alpha-numeric'],
    trim: true
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga'],
    required: true
  },
  contact: {
    type: String,
    required: true,
    match: [/^\+?[0-9\s\-]{10,}$/, 'Please enter a valid phone number']
  },
  sellingPrice: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Procurement', procurementSchema);
