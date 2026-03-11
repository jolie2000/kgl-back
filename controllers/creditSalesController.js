// This controller handles credit sales and credit sales history.
const CreditSale = require('../models/CreditSale');
const { reduceStock } = require('../services/stockService');
const { isAllowedProduce, normalizeProduce } = require('../constants/produce');

const parseNumericInput = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.replace(/,/g, '').trim());
  return Number(value);
};

// Record a new credit sale.
exports.createCreditSale = async (req, res) => {
  try {
    const {
      buyerName,
      nationalId,
      location,
      contact,
      amountDue,
      dueDate,
      produceName,
      produceType,
      tonnage,
      dispatchDate,
      branch
    } = req.body;

    const normalizedProduceName = normalizeProduce(produceName);
    if (!isAllowedProduce(normalizedProduceName)) {
      return res.status(400).json({ message: 'Selected produce is not supported for credit sales.' });
    }

    const parsedTonnage = parseNumericInput(tonnage);
    const parsedAmountDue = parseNumericInput(amountDue);

    if (!Number.isFinite(parsedTonnage) || !Number.isFinite(parsedAmountDue)) {
      return res.status(400).json({ message: 'Please enter valid numeric values for tonnage and amount due.' });
    }

    const resolvedBranch = req.user.branch === 'All' ? branch : req.user.branch;
    const resolvedSalesAgent = req.user.name;

    // Credit sales also reduce stock before the sale is saved.
    await reduceStock(normalizedProduceName, resolvedBranch, parsedTonnage);

    const creditSale = new CreditSale({
      buyerName,
      nationalId,
      location,
      contact,
      amountDue: parsedAmountDue,
      salesAgent: resolvedSalesAgent,
      dueDate,
      produceName: normalizedProduceName,
      produceType,
      tonnage: parsedTonnage,
      dispatchDate,
      branch: resolvedBranch
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

// Get credit sales based on the logged-in user's access.
exports.getAllCreditSales = async (req, res) => {
  try {
    if (!['SalesAgent', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view credit sales' });
    }

    const query = {};
    if (req.user.role === 'SalesAgent') {
      query.salesAgent = req.user.name;
      query.branch = req.user.branch;
    } else if (req.user.branch !== 'All') {
      query.branch = req.user.branch;
    }

    const creditSales = await CreditSale.find(query).sort({ createdAt: -1 });
    res.status(200).json(creditSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
