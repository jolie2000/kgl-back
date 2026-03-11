// These routes handle stock entry, stock updates, and stock deletion.
const express = require('express');
const router = express.Router();
const { createProcurement, getAllProcurements, updateProcurement, deleteProcurement } = require('../controllers/procurementController');
const { protect, managerOnly, salesOrManager } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, managerOnly, createProcurement)
  .get(protect, salesOrManager, getAllProcurements);

router.route('/:id')
  .put(protect, managerOnly, updateProcurement)
  .delete(protect, managerOnly, deleteProcurement);

module.exports = router;
