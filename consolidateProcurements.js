// This file cleans old stock data by joining repeated product records together.
const mongoose = require('mongoose');
const Procurement = require('./models/Procurement');
const { normalizeProduce, isAllowedProduce } = require('./constants/produce');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kgl_db';

const consolidateProcurements = async () => {
  await mongoose.connect(MONGODB_URI);

  const records = await Procurement.find({}).sort({ updatedAt: -1, createdAt: -1 });
  const groups = new Map();

  for (const record of records) {
    const normalizedProduceName = normalizeProduce(record.produceName);
    const branch = record.branch;
    const key = `${normalizedProduceName}::${branch}`;

    if (!groups.has(key)) {
      groups.set(key, {
        primary: record,
        normalizedProduceName,
        branch,
        tonnage: 0,
        cost: 0,
        duplicates: []
      });
    }

    const group = groups.get(key);
    group.tonnage += Number(record.tonnage || 0);
    group.cost += Number(record.cost || 0);

    if (group.primary._id.toString() !== record._id.toString()) {
      group.duplicates.push(record._id);
    }
  }

  let updatedCount = 0;
  let deletedCount = 0;
  let skippedCount = 0;

  for (const group of groups.values()) {
    const { primary, normalizedProduceName, tonnage, cost, duplicates } = group;

    if (!isAllowedProduce(normalizedProduceName)) {
      skippedCount += 1;
      continue;
    }

    await Procurement.updateOne(
      { _id: primary._id },
      {
        $set: {
          produceName: normalizedProduceName,
          tonnage,
          cost
        }
      }
    );
    updatedCount += 1;

    if (duplicates.length > 0) {
      const result = await Procurement.deleteMany({ _id: { $in: duplicates } });
      deletedCount += Number(result.deletedCount || 0);
    }
  }

  console.log(`Consolidated ${updatedCount} stock groups, removed ${deletedCount} duplicate procurement records, skipped ${skippedCount} unsupported product groups.`);
};

consolidateProcurements()
  .catch((error) => {
    console.error('Failed to consolidate procurements:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
