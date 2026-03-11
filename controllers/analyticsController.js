// This controller builds report data for company performance and branch comparison.
const CashSale = require('../models/CashSale');
const CreditSale = require('../models/CreditSale');
const Procurement = require('../models/Procurement');
const { ALLOWED_PRODUCE } = require('../constants/produce');

// @desc    Get complete business aggregations for the Director
// @route   GET /api/analytics
// @access  Director Only
exports.getAggregations = async (req, res) => {
  try {
    // Basic aggregation: total revenue per branch (Cash Sales)
    const cashSalesAgg = await CashSale.aggregate([
      {
        $group: {
          _id: "$branch",
          totalRevenue: { $sum: "$amountPaid" },
          totalTonnageSold: { $sum: "$tonnage" },
          salesCount: { $sum: 1 }
        }
      }
    ]);

    // Basic aggregation: total expected revenue (Credit Sales)
    const creditSalesAgg = await CreditSale.aggregate([
      {
        $group: {
          _id: null,
          totalExpectedRevenue: { $sum: "$amountDue" },
          totalTonnageSold: { $sum: "$tonnage" },
          salesCount: { $sum: 1 }
        }
      }
    ]);

    // Procurement totals
    const procurementAgg = await Procurement.aggregate([
      {
        $group: {
          _id: "$branch",
          totalTonnageProcured: { $sum: "$tonnage" }, // Current stock basically
          totalCost: { $sum: "$cost" }
        }
      }
    ]);

    res.status(200).json({
      cashSales: cashSalesAgg,
      creditSales: creditSalesAgg[0] || { totalExpectedRevenue: 0, totalTonnageSold: 0, salesCount: 0 },
      procurement: procurementAgg
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get business insights for dashboards/charts
// @route   GET /api/analytics/business-insights
// @access  Director Only
exports.getBusinessInsights = async (req, res) => {
  try {
    const firstDay = new Date();
    firstDay.setDate(1);
    firstDay.setHours(0, 0, 0, 0);

    const nextMonth = new Date(firstDay);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const [cashByProduce, creditByProduce, cashByBranch, creditByBranch, procuredThisMonth, creditRisk] = await Promise.all([
      CashSale.aggregate([
        { $group: { _id: '$produceName', totalTonnage: { $sum: '$tonnage' } } }
      ]),
      CreditSale.aggregate([
        { $group: { _id: '$produceName', totalTonnage: { $sum: '$tonnage' } } }
      ]),
      CashSale.aggregate([
        { $group: { _id: '$branch', totalRevenue: { $sum: '$amountPaid' } } }
      ]),
      CreditSale.aggregate([
        { $group: { _id: '$branch', totalRevenue: { $sum: '$amountDue' } } }
      ]),
      Procurement.aggregate([
        {
          $match: {
            date: { $gte: firstDay, $lt: nextMonth },
            produceName: { $not: /cassava/i }
          }
        },
        {
          $group: {
            _id: '$produceName',
            totalTonnage: { $sum: '$tonnage' }
          }
        }
      ]),
      CreditSale.find({}, 'buyerName amountDue produceName dueDate')
        .sort({ amountDue: -1, dueDate: 1 })
        .limit(10)
        .lean()
    ]);

    const produceTemplate = ALLOWED_PRODUCE.map((name) => ({ produceName: name, totalTonnage: 0 }));
    const topSellingMap = new Map(produceTemplate.map((item) => [item.produceName, item.totalTonnage]));

    for (const row of cashByProduce) {
      if (topSellingMap.has(row._id)) {
        topSellingMap.set(row._id, topSellingMap.get(row._id) + Number(row.totalTonnage || 0));
      }
    }
    for (const row of creditByProduce) {
      if (topSellingMap.has(row._id)) {
        topSellingMap.set(row._id, topSellingMap.get(row._id) + Number(row.totalTonnage || 0));
      }
    }

    const topSellingProduce = ALLOWED_PRODUCE.map((produceName) => ({
      produceName,
      totalTonnage: topSellingMap.get(produceName) || 0
    }));

    const branchTemplate = ['Maganjo', 'Matugga'].map((branch) => ({ branch, totalRevenue: 0 }));
    const branchMap = new Map(branchTemplate.map((item) => [item.branch, item.totalRevenue]));

    for (const row of cashByBranch) {
      if (branchMap.has(row._id)) {
        branchMap.set(row._id, branchMap.get(row._id) + Number(row.totalRevenue || 0));
      }
    }
    for (const row of creditByBranch) {
      if (branchMap.has(row._id)) {
        branchMap.set(row._id, branchMap.get(row._id) + Number(row.totalRevenue || 0));
      }
    }

    const branchSalesComparison = ['Maganjo', 'Matugga'].map((branch) => ({
      branch,
      totalRevenue: branchMap.get(branch) || 0
    }));

    const procurementMap = new Map(ALLOWED_PRODUCE.map((name) => [name, 0]));
    for (const row of procuredThisMonth) {
      if (procurementMap.has(row._id)) {
        procurementMap.set(row._id, Number(row.totalTonnage || 0));
      }
    }
    const procurementSummary = ALLOWED_PRODUCE.map((produceName) => ({
      produceName,
      totalTonnage: procurementMap.get(produceName) || 0
    }));

    res.status(200).json({
      topSellingProduce,
      branchSalesComparison,
      procurementSummary,
      creditSalesRisk: creditRisk
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
