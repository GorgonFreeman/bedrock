const { funcApi, logDeep, askQuestion } = require('../utils');
const { pipe17InventoryItemsGet } = require('./pipe17InventoryItemsGet');

const pipe17InventorySnapshotExport = async (
  receiptId,
  {
    credsPath,
  } = {},
) => {

  // Fetch all inventory items
  const inventoryItemsResponse = await pipe17InventoryItemsGet({
    credsPath,
    onHand_gt: 0,
    totals: true, // To fetch the total of all inventory items across all locations
    count: 2000, // Page size
  });

  const { success: inventoryItemSuccess, result: inventoryItems } = inventoryItemsResponse;
  if (!inventoryItemSuccess) {
    return {
      success: false,
      message: 'Failed to fetch inventory items',
    };
  }

  const inventoryLevels = {};
  for (const inventoryItem of inventoryItems) {

    const {
      sku,
      available = 0,
      committed = 0,
      onHand = 0,
    } = inventoryItem;

    if (!sku) {
      continue;
    }

    if (!inventoryLevels[sku]) {
      inventoryLevels[sku] = {
        available: 0,
        committed: 0,
        onHand: 0,
      };
    }

    inventoryLevels[sku].available += available;
    inventoryLevels[sku].committed += committed;
    inventoryLevels[sku].onHand += onHand;
  }

  // Upload to google sheets

  return {
    success: true,
    result: {},
  };
};

const pipe17InventorySnapshotExportApi = funcApi(pipe17InventorySnapshotExport);

module.exports = {
  pipe17InventorySnapshotExport,
  pipe17InventorySnapshotExportApi,
};

// curl localhost:8000/pipe17InventorySnapshotExport