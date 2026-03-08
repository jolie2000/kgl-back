const express = require('express');
const router = express.Router();
const { getAggregations } = require('../controllers/analyticsController');
const { protect, directorOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, directorOnly, getAggregations);

module.exports = router;
