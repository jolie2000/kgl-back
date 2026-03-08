const CashSale = require('../models/CashSale');
const CreditSale = require('../models/CreditSale');
const Procurement = require('../models/Procurement');

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
