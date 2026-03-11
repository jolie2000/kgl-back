// This model stores stocked goods and procurement details.
const mongoose = require('mongoose');
const { ALLOWED_PRODUCE } = require('../constants/produce');

const procurementSchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true,
    enum: ALLOWED_PRODUCE,
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
    min: [0.01, 'Tonnage must be greater than 0kg'],
    validate: {
      validator: function validateIndividualDealerMinimum(value) {
        if (this.supplierType === 'IndividualDealer') {
          return value >= 1000;
        }
        return true;
      },
      message: 'Individual dealers must supply at least 1000kg (1 tonne)'
    }
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
  supplierType: {
    type: String,
    enum: ['IndividualDealer', 'Company', 'Farm'],
    required: true,
    default: 'Company'
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
