const JOB_TYPES = [
  'report',
  'import',
  'prepare',
  'update',
  'delete',
  'export',
  'automation',
  'sync',  
];

const JOB_SUBTYPES = [
  'inventory',
  'replenishment',
  'oos_sku_on_order',
  'open_orders',
  'purchases',
  'transfers',
  'arrivals',
  'receipts',
  'products',
  'organizations',
  'orders',
  'shipments',
  'fulfillments',
  'locations',
  'shipping_methods',
  'returns',
  'exceptions',
  'lookup_objects',
  'statements',
  'users',
];

module.exports = {
  JOB_TYPES,
  JOB_SUBTYPES,
};