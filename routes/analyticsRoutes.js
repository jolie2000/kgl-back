// These routes return report data for the director.
const express = require('express');
const router = express.Router();
const { getAggregations, getBusinessInsights } = require('../controllers/analyticsController');
const { protect, directorMrOrbanOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, directorMrOrbanOnly, getAggregations);

router.route('/business-insights')
  .get(protect, directorMrOrbanOnly, getBusinessInsights);

module.exports = router;
