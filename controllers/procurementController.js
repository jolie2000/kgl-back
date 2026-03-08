const Procurement = require('../models/Procurement');

// @desc    Record a new produce procurement
// @route   POST /api/procurement
// @access  Manager Only (To be enforced via middleware later if needed)
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
      branch,
      contact,
      sellingPrice
    } = req.body;

    const procurement = new Procurement({
      produceName,
      produceType,
      date,
      time,
      tonnage,
      cost,
      dealerName,
      branch,
      contact,
      sellingPrice
    });

    const savedProcurement = await procurement.save();
    res.status(201).json(savedProcurement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all procurements
// @route   GET /api/procurement
// @access  Manager/Director
exports.getAllProcurements = async (req, res) => {
  try {
    const procurements = await Procurement.find().sort({ createdAt: -1 });
    res.status(200).json(procurements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
