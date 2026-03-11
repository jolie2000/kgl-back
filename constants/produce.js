// This file lists the allowed goods and helps keep product names consistent.
const ALLOWED_PRODUCE = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];

const canonicalProduceMap = new Map([
  ['beans', 'Beans'],
  ['grainmaize', 'Grain Maize'],
  ['cowpeas', 'Cow peas'],
  ['gnuts', 'G-nuts'],
  ['groundnuts', 'G-nuts'],
  ['soybeans', 'Soybeans']
]);

const sanitizeProduceKey = (value) => (value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z]/g, '');

const normalizeProduce = (value) => {
  const directMatch = (value || '').trim();
  const canonicalMatch = canonicalProduceMap.get(sanitizeProduceKey(value));
  return canonicalMatch || directMatch;
};

const isAllowedProduce = (value) => ALLOWED_PRODUCE.includes(normalizeProduce(value));

module.exports = { ALLOWED_PRODUCE, normalizeProduce, isAllowedProduce };
