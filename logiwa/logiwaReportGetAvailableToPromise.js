// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1AvailableToPromise~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const logiwaReportGetAvailableToPromise = async (
  {
    sku_eq,

    clientIdentifier_eq,
    clientIdentifier_in,

    warehouseIdentifier_eq,
    warehouseIdentifier_in,

    totalStockQuantity_eq,
    totalStockQuantity_gt,
    totalStockQuantity_lt,
    totalStockQuantity_gte,
    totalStockQuantity_lte,

    inventoryAtpQuantity_eq,
    inventoryAtpQuantity_gt,
    inventoryAtpQuantity_lt,
    inventoryAtpQuantity_gte,
    inventoryAtpQuantity_lte,

    plannedAtpQuantity_eq,
    plannedAtpQuantity_gt,
    plannedAtpQuantity_lt,
    plannedAtpQuantity_gte,
    plannedAtpQuantity_lte,
  },
  {
    credsPath,
    apiVersion = 'v3.1',

    page = 0,
    perPage = MAX_PER_PAGE,

    ...getterOptions
  } = {},
) => {

  const params = {
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(clientIdentifier_in && { 'ClientIdentifier.in': clientIdentifier_in }),
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(warehouseIdentifier_in && { 'WarehouseIdentifier.in': warehouseIdentifier_in }),
    ...(totalStockQuantity_eq && { 'TotalStockQuantity.eq': totalStockQuantity_eq }),
    ...(totalStockQuantity_gt && { 'TotalStockQuantity.gt': totalStockQuantity_gt }),
    ...(totalStockQuantity_lt && { 'TotalStockQuantity.lt': totalStockQuantity_lt }),
    ...(totalStockQuantity_gte && { 'TotalStockQuantity.gte': totalStockQuantity_gte }),
    ...(totalStockQuantity_lte && { 'TotalStockQuantity.lte': totalStockQuantity_lte }),
    ...(inventoryAtpQuantity_eq && { 'InventoryATPQuantity.eq': inventoryAtpQuantity_eq }),
    ...(inventoryAtpQuantity_gt && { 'InventoryATPQuantity.gt': inventoryAtpQuantity_gt }),
    ...(inventoryAtpQuantity_lt && { 'InventoryATPQuantity.lt': inventoryAtpQuantity_lt }),
    ...(inventoryAtpQuantity_gte && { 'InventoryATPQuantity.gte': inventoryAtpQuantity_gte }),
    ...(inventoryAtpQuantity_lte && { 'InventoryATPQuantity.lte': inventoryAtpQuantity_lte }),
    ...(plannedAtpQuantity_eq && { 'PlannedATPQuantity.eq': plannedAtpQuantity_eq }),
    ...(plannedAtpQuantity_gt && { 'PlannedATPQuantity.gt': plannedAtpQuantity_gt }),
    ...(plannedAtpQuantity_lt && { 'PlannedATPQuantity.lt': plannedAtpQuantity_lt }),
    ...(plannedAtpQuantity_gte && { 'PlannedATPQuantity.gte': plannedAtpQuantity_gte }),
    ...(plannedAtpQuantity_lte && { 'PlannedATPQuantity.lte': plannedAtpQuantity_lte }),
  };

  const response = await logiwaGet(
    `/Report/AvailableToPromise/i/${ page }/s/${ perPage }`,
    {
      credsPath,
      apiVersion,
      params,
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const logiwaReportGetAvailableToPromiseApi = async (req, res) => {
  const { 
    criteria,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'criteria', criteria, p => objHasAny(p, ['sku_eq', 'clientIdentifier_eq', 'clientIdentifier_in', 'warehouseIdentifier_eq', 'warehouseIdentifier_in', 'totalStockQuantity_eq', 'totalStockQuantity_gt', 'totalStockQuantity_lt', 'totalStockQuantity_gte', 'totalStockQuantity_lte', 'inventoryAtpQuantity_eq', 'inventoryAtpQuantity_gt', 'inventoryAtpQuantity_lt', 'inventoryAtpQuantity_gte', 'inventoryAtpQuantity_lte', 'plannedAtpQuantity_eq', 'plannedAtpQuantity_gt', 'plannedAtpQuantity_lt', 'plannedAtpQuantity_gte', 'plannedAtpQuantity_lte'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await logiwaReportGetAvailableToPromise(
    criteria,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaReportGetAvailableToPromise,
  logiwaReportGetAvailableToPromiseApi,
};

// curl localhost:8000/logiwaReportGetAvailableToPromise -H "Content-Type: application/json" -d '{ "criteria": { "clientIdentifier_eq": "9f1ea39a-fccc-48af-8986-a35c34fcef8b" } }'
// curl localhost:8000/logiwaReportGetAvailableToPromise -H "Content-Type: application/json" -d '{ "criteria": { "totalStockQuantity_gte": 500 } }'