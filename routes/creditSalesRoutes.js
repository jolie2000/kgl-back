// These routes handle credit sales.
const express = require('express');
const router = express.Router();
const { createCreditSale, getAllCreditSales } = require('../controllers/creditSalesController');
const { protect, salesOrManager } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, salesOrManager, createCreditSale)
  .get(protect, salesOrManager, getAllCreditSales);

module.exports = router;
