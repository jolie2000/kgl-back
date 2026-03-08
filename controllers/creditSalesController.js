const CreditSale = require('../models/CreditSale');
const Procurement = require('../models/Procurement');

// Helper function to handle stock reduction
const reduceStock = async (produceName, branch, requestedTonnage) => {
  // Find all procurements for this produce and branch that have some tonnage left
  const procurements = await Procurement.find({ 
    produceName, 
    branch, 
    tonnage: { $gt: 0 } 
  }).sort({ date: 1 }); // FIFO

  let totalAvailable = procurements.reduce((sum, p) => sum + p.tonnage, 0);

  if (totalAvailable < requestedTonnage) {
    throw new Error(`Insufficient stock. Available: ${totalAvailable}kg, Requested: ${requestedTonnage}kg`);
  }

  let remainingToFulfill = requestedTonnage;

  for (let proc of procurements) {
    if (remainingToFulfill <= 0) break;

    if (proc.tonnage >= remainingToFulfill) {
      proc.tonnage -= remainingToFulfill;
      await proc.save();
      remainingToFulfill = 0;
    } else {
      remainingToFulfill -= proc.tonnage;
      proc.tonnage = 0;
      await proc.save();
    }
  }
};

// @desc    Record a new credit sale
// @route   POST /api/credit-sales
// @access  Sales Agent / Manager
exports.createCreditSale = async (req, res) => {
  try {
    const {
      buyerName,
      nationalId,
      location,
      contact,
      amountDue,
      salesAgent,
      dueDate,
      produceName,
      produceType,
      tonnage,
      dispatchDate,
      branch
    } = req.body;

    // Credit sales also require stock to be reduced
    await reduceStock(produceName, branch, tonnage);

    const creditSale = new CreditSale({
      buyerName,
      nationalId,
      location,
      contact,
      amountDue,
      salesAgent,
      dueDate,
      produceName,
      produceType,
      tonnage,
      dispatchDate,
      branch
    });

    const savedCreditSale = await creditSale.save();
    res.status(201).json(savedCreditSale);
  } catch (error) {
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message, outOfStockNotification: true });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all credit sales
// @route   GET /api/credit-sales
exports.getAllCreditSales = async (req, res) => {
  try {
    const creditSales = await CreditSale.find().sort({ createdAt: -1 });
    res.status(200).json(creditSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
