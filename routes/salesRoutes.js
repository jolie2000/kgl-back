const express = require('express');
const router = express.Router();
const { createSale, getAllSales } = require('../controllers/salesController');

router.route('/')
  .post(createSale)
  .get(getAllSales);

module.exports = router;
