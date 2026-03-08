const CashSale = require('../models/CashSale');
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

// @desc    Record a new cash sale
// @route   POST /api/sales
// @access  Sales Agent / Manager
exports.createSale = async (req, res) => {
  try {
    const {
      produceName,
      tonnage,
      amountPaid,
      buyerName,
      salesAgent,
      branch
    } = req.body;

    // 1. Check stock & reduce (Business Rule: Only products in stock should be sold)
    // 2. Business Rule: Tonnage is reduced upon sale.
    await reduceStock(produceName, branch, tonnage);
    
    // Note: In a real system, we'd also trigger a notification if stock hits 0.
    // For this scope, the exception thrown in reduceStock or a simple check afterwards is fine.

    // 3. Create the sale record
    const sale = new CashSale({
      produceName,
      tonnage,
      amountPaid,
      buyerName,
      salesAgent,
      branch
    });

    const savedSale = await sale.save();
    res.status(201).json(savedSale);
  } catch (error) {
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message, outOfStockNotification: true });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all cash sales
// @route   GET /api/sales
exports.getAllSales = async (req, res) => {
  try {
    const sales = await CashSale.find().sort({ createdAt: -1 });
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
