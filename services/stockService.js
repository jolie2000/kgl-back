// This file keeps all main stock actions in one place.
const Procurement = require('../models/Procurement');
const Notification = require('../models/Notification');

const parseNumericInput = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.replace(/,/g, '').trim());
  return Number(value);
};

// Create one unread alert and avoid repeating the same alert too often.
const createStockNotification = async ({ type, produceName, branch, message }) => {
  const lastHour = new Date(Date.now() - (60 * 60 * 1000));
  const existing = await Notification.findOne({
    type,
    produceName,
    branch,
    read: false,
    createdAt: { $gte: lastHour }
  });

  if (!existing) {
    await Notification.create({ type, produceName, branch, message });
  }
};

// Send a low stock alert when stock is below the required limit.
const notifyLowStockIfNeeded = async (produceName, branch, availableTonnage) => {
  const totalAvailable = Number(availableTonnage || 0);

  if (totalAvailable > 0 && totalAvailable < 1000) {
    await createStockNotification({
      type: 'LOW_STOCK',
      produceName,
      branch,
      message: `${produceName} is low on stock at ${branch}. Remaining: ${totalAvailable}kg.`
    });
  }
};

// Join repeated stock records for the same product and branch into one record.
const consolidateStockRecords = async (produceName, branch) => {
  const records = await Procurement.find({ produceName, branch }).sort({ updatedAt: -1 });
  if (records.length <= 1) {
    return records[0] || null;
  }

  const primary = records[0];
  const totalTonnage = records.reduce((sum, item) => sum + Number(item.tonnage || 0), 0);
  const totalCost = records.reduce((sum, item) => sum + Number(item.cost || 0), 0);

  primary.tonnage = totalTonnage;
  primary.cost = totalCost;
  await primary.save();

  const duplicateIds = records.slice(1).map((entry) => entry._id);
  await Procurement.deleteMany({ _id: { $in: duplicateIds } });

  return primary;
};

// Reduce stock after a sale and create alerts when stock becomes too low.
const reduceStock = async (produceName, branch, requestedTonnage) => {
  const stockRecord = await consolidateStockRecords(produceName, branch);
  const parsedRequestedTonnage = parseNumericInput(requestedTonnage);

  if (!Number.isFinite(parsedRequestedTonnage) || parsedRequestedTonnage <= 0) {
    throw new Error('Tonnage must be a valid number greater than 0kg');
  }

  const totalAvailable = Number(stockRecord?.tonnage || 0);

  if (totalAvailable < 1000) {
    await notifyLowStockIfNeeded(produceName, branch, totalAvailable);
    throw new Error(`Sales blocked: ${produceName} stock is below 1000kg at ${branch}. Current stock: ${totalAvailable}kg.`);
  }

  if (totalAvailable < parsedRequestedTonnage) {
    await createStockNotification({
      type: 'OUT_OF_STOCK',
      produceName,
      branch,
      message: `Insufficient stock for ${produceName} at ${branch}. Available: ${totalAvailable}kg, Requested: ${parsedRequestedTonnage}kg.`
    });
    throw new Error(`Insufficient stock. Available: ${totalAvailable}kg, Requested: ${parsedRequestedTonnage}kg`);
  }

  stockRecord.tonnage = totalAvailable - parsedRequestedTonnage;
  await stockRecord.save();
  const totalRemaining = Number(stockRecord.tonnage || 0);

  if (totalRemaining <= 0) {
    await createStockNotification({
      type: 'OUT_OF_STOCK',
      produceName,
      branch,
      message: `${produceName} is out of stock at ${branch}.`
    });
  } else if (totalRemaining < 1000) {
    await notifyLowStockIfNeeded(produceName, branch, totalRemaining);
  }
};

module.exports = { reduceStock, consolidateStockRecords, notifyLowStockIfNeeded };
