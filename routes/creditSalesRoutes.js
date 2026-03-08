const express = require('express');
const router = express.Router();
const { createCreditSale, getAllCreditSales } = require('../controllers/creditSalesController');

router.route('/')
  .post(createCreditSale)
  .get(getAllCreditSales);

module.exports = router;
