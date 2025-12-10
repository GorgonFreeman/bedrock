// https://apidoc.pipe17.com/#/operations/listInventory

const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Get } = require('../pipe17/pipe17.utils');

const pipe17InventoryItemsGet = async (
  {
    credsPath,

    // API options
    available,
    available_gt,
    available_lt,
    count,
    entityId,
    event,
    integration,
    inventoryId,
    inventoryNotTracked,
    keys,
    ledger,
    locationId,
    onHand,
    onHand_gt,
    onHand_lt,
    order,
    pagination,
    requestorId,
    since,
    skip,
    sku,
    sku_gt,
    sku_lt,
    tags,
    totals,
    type,
    until,
    updatedSince,
    updatedUntil,
    vendorSKU,

    ...getterOptions
  } = {},
) => {

  const params = {
    ...available && { available },
    ...available_gt && { available_gt },
    ...available_lt && { available_lt },
    ...count && { count },
    ...entityId && { entityId },
    ...event && { event },
    ...integration && { integration },
    ...inventoryId && { inventoryId },
    ...inventoryNotTracked && { inventoryNotTracked },
    ...keys && { keys },
    ...ledger && { ledger },
    ...locationId && { locationId },
    ...onHand && { onHand },
    ...onHand_gt && { onHand_gt },
    ...onHand_lt && { onHand_lt },
    ...order && { order },
    ...pagination && { pagination },
    ...requestorId && { requestorId },
    ...since && { since },
    ...skip && { skip },
    ...sku && { sku },
    ...sku_gt && { sku_gt },
    ...sku_lt && { sku_lt },
    ...tags && { tags },
    ...totals && { totals },
    ...type && { type },
    ...until && { until },
    ...updatedSince && { updatedSince },
    ...updatedUntil && { updatedUntil },
    ...vendorSKU && { vendorSKU },
  };

  const response = await pipe17Get(
    '/inventory', 
    'inventory', 
    {
      credsPath,
      ...params && { params },
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const pipe17InventoryItemsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await pipe17InventoryItemsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17InventoryItemsGet,
  pipe17InventoryItemsGetApi,
};

// curl localhost:8000/pipe17InventoryItemsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 300 } }'
// curl localhost:8000/pipe17InventoryItemsGet -H "Content-Type: application/json" -d '{ "options": { "sku": "WFMD94-2-S,FSBOM172-15-S,EXKM199-1-XXS" } }'