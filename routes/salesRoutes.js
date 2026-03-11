// These routes handle cash sales.
const express = require('express');
const router = express.Router();
const { createSale, getAllSales } = require('../controllers/salesController');
const { protect, salesOrManager } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, salesOrManager, createSale)
  .get(protect, salesOrManager, getAllSales);

module.exports = router;
