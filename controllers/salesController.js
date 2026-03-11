// This controller handles cash sales and sales history.
const CashSale = require('../models/CashSale');
const { reduceStock } = require('../services/stockService');
const { isAllowedProduce, normalizeProduce } = require('../constants/produce');

const parseNumericInput = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.replace(/,/g, '').trim());
  return Number(value);
};

// Record a new cash sale.
exports.createSale = async (req, res) => {
  try {
    const {
      produceName,
      tonnage,
      amountPaid,
      buyerName,
      branch
    } = req.body;

    const normalizedProduceName = normalizeProduce(produceName);
    if (!isAllowedProduce(normalizedProduceName)) {
      return res.status(400).json({ message: 'Selected produce is not supported for stock sales.' });
    }

    const parsedTonnage = parseNumericInput(tonnage);
    const parsedAmountPaid = parseNumericInput(amountPaid);

    if (!Number.isFinite(parsedTonnage) || !Number.isFinite(parsedAmountPaid)) {
      return res.status(400).json({ message: 'Please enter valid numeric values for tonnage and amount paid.' });
    }

    const resolvedBranch = req.user.branch === 'All' ? branch : req.user.branch;
    const resolvedSalesAgent = req.user.name;

    // Check stock first, then reduce it before saving the sale.
    await reduceStock(normalizedProduceName, resolvedBranch, parsedTonnage);

    // Save the sale after stock has been updated.
    const sale = new CashSale({
      produceName: normalizedProduceName,
      tonnage: parsedTonnage,
      amountPaid: parsedAmountPaid,
      buyerName,
      salesAgent: resolvedSalesAgent,
      branch: resolvedBranch
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

// Get cash sales based on the logged-in user's access.
exports.getAllSales = async (req, res) => {
  try {
    if (!['SalesAgent', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view sales' });
    }

    const query = {};
    if (req.user.role === 'SalesAgent') {
      query.salesAgent = req.user.name;
      query.branch = req.user.branch;
    } else if (req.user.branch !== 'All') {
      query.branch = req.user.branch;
    }

    const sales = await CashSale.find(query).sort({ createdAt: -1 });
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
