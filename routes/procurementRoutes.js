const express = require('express');
const router = express.Router();
const { createProcurement, getAllProcurements } = require('../controllers/procurementController');

router.route('/')
  .post(createProcurement)
  .get(getAllProcurements);

module.exports = router;
