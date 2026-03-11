// This controller handles adding, viewing, editing, and deleting stock records.
const Procurement = require('../models/Procurement');
const { isAllowedProduce, normalizeProduce } = require('../constants/produce');
const { notifyLowStockIfNeeded } = require('../services/stockService');

const parseNumericInput = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, '').trim());
  }
  return Number(value);
};

// Record new stock for a product.
exports.createProcurement = async (req, res) => {
  try {
    const {
      produceName,
      produceType,
      date,
      time,
      tonnage,
      cost,
      dealerName,
      supplierType,
      branch,
      contact,
      sellingPrice
    } = req.body;

    const normalizedProduceName = normalizeProduce(produceName);
    if (!isAllowedProduce(normalizedProduceName)) {
      return res.status(400).json({ message: 'Only supported produce can be stocked. Cassava is not allowed.' });
    }

    // A branch manager can only save stock for their own branch.
    const assignedBranch = req.user.branch === 'All' ? branch : req.user.branch;
    const incomingTonnage = parseNumericInput(tonnage);
    const incomingCost = parseNumericInput(cost);
    const incomingSellingPrice = parseNumericInput(sellingPrice);

    if (!Number.isFinite(incomingTonnage) || !Number.isFinite(incomingCost) || !Number.isFinite(incomingSellingPrice)) {
      return res.status(400).json({ message: 'Please enter valid numeric values for tonnage, cost, and selling price.' });
    }

    const sameProductStock = await Procurement.find({
      produceName: normalizedProduceName,
      branch: assignedBranch
    }).sort({ updatedAt: -1 });

    if (sameProductStock.length > 0) {
      const primary = sameProductStock[0];
      const existingTonnage = sameProductStock.reduce((sum, item) => sum + Number(item.tonnage || 0), 0);
      const existingCost = sameProductStock.reduce((sum, item) => sum + Number(item.cost || 0), 0);

      primary.produceName = normalizedProduceName;
      primary.produceType = produceType;
      primary.date = date;
      primary.time = time;
      primary.tonnage = existingTonnage + incomingTonnage;
      primary.cost = existingCost + incomingCost;
      primary.dealerName = dealerName;
      primary.supplierType = supplierType || 'Company';
      primary.branch = assignedBranch;
      primary.contact = contact;
      primary.sellingPrice = incomingSellingPrice;

      const savedProcurement = await primary.save();
      await notifyLowStockIfNeeded(normalizedProduceName, assignedBranch, savedProcurement.tonnage);

      if (sameProductStock.length > 1) {
        const duplicateIds = sameProductStock.slice(1).map((entry) => entry._id);
        await Procurement.deleteMany({ _id: { $in: duplicateIds } });
      }

      return res.status(200).json(savedProcurement);
    }

    const procurement = new Procurement({
      produceName: normalizedProduceName,
      produceType,
      date,
      time,
      tonnage: incomingTonnage,
      cost: incomingCost,
      dealerName,
      supplierType: supplierType || 'Company',
      branch: assignedBranch,
      contact,
      sellingPrice: incomingSellingPrice
    });

    const savedProcurement = await procurement.save();
    await notifyLowStockIfNeeded(normalizedProduceName, assignedBranch, savedProcurement.tonnage);
    res.status(201).json(savedProcurement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get current stock records based on the user's branch access.
exports.getAllProcurements = async (req, res) => {
  try {
    const matchStage = {};

    if (!['Manager', 'SalesAgent'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view procurements' });
    }

    if (req.user.role === 'SalesAgent') {
      matchStage.branch = req.user.branch;
    } else if (req.user.branch !== 'All') {
      matchStage.branch = req.user.branch;
    }

    matchStage.produceName = { $not: /cassava/i };

    const procurements = await Procurement.aggregate([
      { $match: matchStage },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: {
            produceName: '$produceName',
            branch: '$branch'
          },
          sourceId: { $first: '$_id' },
          produceType: { $first: '$produceType' },
          tonnage: { $sum: '$tonnage' },
          cost: { $sum: '$cost' },
          dealerName: { $first: '$dealerName' },
          supplierType: { $first: '$supplierType' },
          contact: { $first: '$contact' },
          sellingPrice: { $first: '$sellingPrice' },
          date: { $first: '$date' },
          time: { $first: '$time' },
          updatedAt: { $first: '$updatedAt' }
        }
      },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: { $concat: ['$_id.produceName', '-', '$_id.branch'] },
          sourceId: 1,
          produceName: '$_id.produceName',
          branch: '$_id.branch',
          produceType: 1,
          tonnage: 1,
          cost: 1,
          dealerName: 1,
          supplierType: 1,
          contact: 1,
          sellingPrice: 1,
          date: 1,
          time: 1,
          updatedAt: 1
        }
      }
    ]);
    res.status(200).json(procurements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update one stock record.
exports.updateProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);

    if (!procurement) {
      return res.status(404).json({ message: 'Procurement record not found' });
    }

    if (req.user.branch !== 'All' && procurement.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Not allowed to update this stock record' });
    }

    const normalizedProduceName = normalizeProduce(req.body.produceName ?? procurement.produceName);
    if (!isAllowedProduce(normalizedProduceName)) {
      return res.status(400).json({ message: 'Only supported produce can be stocked. Cassava is not allowed.' });
    }

    const assignedBranch = req.user.branch === 'All'
      ? (req.body.branch || procurement.branch)
      : req.user.branch;

    const updates = {
      produceName: normalizedProduceName,
      produceType: req.body.produceType ?? procurement.produceType,
      date: req.body.date ?? procurement.date,
      time: req.body.time ?? procurement.time,
      tonnage: req.body.tonnage !== undefined ? parseNumericInput(req.body.tonnage) : procurement.tonnage,
      cost: req.body.cost !== undefined ? parseNumericInput(req.body.cost) : procurement.cost,
      dealerName: req.body.dealerName ?? procurement.dealerName,
      supplierType: req.body.supplierType ?? procurement.supplierType,
      branch: assignedBranch,
      contact: req.body.contact ?? procurement.contact,
      sellingPrice: req.body.sellingPrice !== undefined ? parseNumericInput(req.body.sellingPrice) : procurement.sellingPrice
    };

    if (!Number.isFinite(updates.tonnage) || !Number.isFinite(updates.cost) || !Number.isFinite(updates.sellingPrice)) {
      return res.status(400).json({ message: 'Please enter valid numeric values for tonnage, cost, and selling price.' });
    }

    const conflictingRecord = await Procurement.findOne({
      _id: { $ne: procurement._id },
      produceName: normalizedProduceName,
      branch: assignedBranch
    }).sort({ updatedAt: -1 });

    if (conflictingRecord) {
      conflictingRecord.tonnage = Number(conflictingRecord.tonnage || 0) + updates.tonnage;
      conflictingRecord.cost = Number(conflictingRecord.cost || 0) + updates.cost;
      conflictingRecord.produceName = normalizedProduceName;
      conflictingRecord.produceType = updates.produceType;
      conflictingRecord.date = updates.date;
      conflictingRecord.time = updates.time;
      conflictingRecord.dealerName = updates.dealerName;
      conflictingRecord.supplierType = updates.supplierType;
      conflictingRecord.branch = assignedBranch;
      conflictingRecord.contact = updates.contact;
      conflictingRecord.sellingPrice = updates.sellingPrice;

      const mergedProcurement = await conflictingRecord.save();
      await Procurement.findByIdAndDelete(procurement._id);
      await notifyLowStockIfNeeded(normalizedProduceName, assignedBranch, mergedProcurement.tonnage);

      return res.status(200).json(mergedProcurement);
    }

    Object.assign(procurement, updates);
    const savedProcurement = await procurement.save();
    await notifyLowStockIfNeeded(normalizedProduceName, assignedBranch, savedProcurement.tonnage);

    res.status(200).json(savedProcurement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete one stock record.
exports.deleteProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);

    if (!procurement) {
      return res.status(404).json({ message: 'Procurement record not found' });
    }

    if (req.user.branch !== 'All' && procurement.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Not allowed to delete this stock record' });
    }

    await Procurement.findByIdAndDelete(procurement._id);
    res.status(200).json({ message: 'Procurement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
