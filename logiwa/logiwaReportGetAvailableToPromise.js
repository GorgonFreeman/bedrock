// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1AvailableToPromise~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep, objHasAny, strictlyFalsey } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const logiwaReportGetAvailableToPromise = async (
  {
    sku_eq,

    clientIdentifier_eq,
    clientIdentifier_in,

    warehouseIdentifier_eq,
    warehouseIdentifier_in,

    plannedAtpQuantity_eq,
    plannedAtpQuantity_gt,
    plannedAtpQuantity_lt,
    plannedAtpQuantity_gte,
    plannedAtpQuantity_lte,
    
    // v3.1 only
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

    // v3.2 only
    undamagedQuantity_eq,
    undamagedQuantity_gt,
    undamagedQuantity_lt,
    undamagedQuantity_gte,
    undamagedQuantity_lte,

    currentAtpQuantity_eq,
    currentAtpQuantity_gt,
    currentAtpQuantity_lt,
    currentAtpQuantity_gte,
    currentAtpQuantity_lte,
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
    ...(!strictlyFalsey(plannedAtpQuantity_eq) && { 'PlannedATPQuantity.eq': plannedAtpQuantity_eq }),
    ...(!strictlyFalsey(plannedAtpQuantity_gt) && { 'PlannedATPQuantity.gt': plannedAtpQuantity_gt }),
    ...(!strictlyFalsey(plannedAtpQuantity_lt) && { 'PlannedATPQuantity.lt': plannedAtpQuantity_lt }),
    ...(!strictlyFalsey(plannedAtpQuantity_gte) && { 'PlannedATPQuantity.gte': plannedAtpQuantity_gte }),
    ...(!strictlyFalsey(plannedAtpQuantity_lte) && { 'PlannedATPQuantity.lte': plannedAtpQuantity_lte }),

    // v3.1 only
    ...(apiVersion === 'v3.1' ? {
      ...(!strictlyFalsey(totalStockQuantity_eq) && { 'TotalStockQuantity.eq': totalStockQuantity_eq }),
      ...(!strictlyFalsey(totalStockQuantity_gt) && { 'TotalStockQuantity.gt': totalStockQuantity_gt }),
      ...(!strictlyFalsey(totalStockQuantity_lt) && { 'TotalStockQuantity.lt': totalStockQuantity_lt }),
      ...(!strictlyFalsey(totalStockQuantity_gte) && { 'TotalStockQuantity.gte': totalStockQuantity_gte }),
      ...(!strictlyFalsey(totalStockQuantity_lte) && { 'TotalStockQuantity.lte': totalStockQuantity_lte }),
      ...(!strictlyFalsey(inventoryAtpQuantity_eq) && { 'InventoryATPQuantity.eq': inventoryAtpQuantity_eq }),
      ...(!strictlyFalsey(inventoryAtpQuantity_gt) && { 'InventoryATPQuantity.gt': inventoryAtpQuantity_gt }),
      ...(!strictlyFalsey(inventoryAtpQuantity_lt) && { 'InventoryATPQuantity.lt': inventoryAtpQuantity_lt }),
      ...(!strictlyFalsey(inventoryAtpQuantity_gte) && { 'InventoryATPQuantity.gte': inventoryAtpQuantity_gte }),
      ...(!strictlyFalsey(inventoryAtpQuantity_lte) && { 'InventoryATPQuantity.lte': inventoryAtpQuantity_lte }),
    } : {}),

    // v3.2 only
    ...(apiVersion === 'v3.2' ? {
      ...(!strictlyFalsey(undamagedQuantity_eq) && { 'UndamagedQuantity.eq': undamagedQuantity_eq }),
      ...(!strictlyFalsey(undamagedQuantity_gt) && { 'UndamagedQuantity.gt': undamagedQuantity_gt }),
      ...(!strictlyFalsey(undamagedQuantity_lt) && { 'UndamagedQuantity.lt': undamagedQuantity_lt }),
      ...(!strictlyFalsey(undamagedQuantity_gte) && { 'UndamagedQuantity.gte': undamagedQuantity_gte }),
      ...(!strictlyFalsey(undamagedQuantity_lte) && { 'UndamagedQuantity.lte': undamagedQuantity_lte }),
      ...(!strictlyFalsey(currentAtpQuantity_eq) && { 'CurrentATPQuantity.eq': currentAtpQuantity_eq }),
      ...(!strictlyFalsey(currentAtpQuantity_gt) && { 'CurrentATPQuantity.gt': currentAtpQuantity_gt }),
      ...(!strictlyFalsey(currentAtpQuantity_lt) && { 'CurrentATPQuantity.lt': currentAtpQuantity_lt }),
      ...(!strictlyFalsey(currentAtpQuantity_gte) && { 'CurrentATPQuantity.gte': currentAtpQuantity_gte }),
      ...(!strictlyFalsey(currentAtpQuantity_lte) && { 'CurrentATPQuantity.lte': currentAtpQuantity_lte }),
    } : {}),
  };

  if (Object.keys(params).length === 0) {

    console.error(
      'empty params',
      'apiVersion', apiVersion,
      'sku_eq', sku_eq,
      'clientIdentifier_eq', clientIdentifier_eq,
      'clientIdentifier_in', clientIdentifier_in,
      'warehouseIdentifier_eq', warehouseIdentifier_eq,
      'warehouseIdentifier_in', warehouseIdentifier_in,
      'plannedAtpQuantity_eq', plannedAtpQuantity_eq,
      'plannedAtpQuantity_gt', plannedAtpQuantity_gt,
      'plannedAtpQuantity_lt', plannedAtpQuantity_lt,
      'plannedAtpQuantity_gte', plannedAtpQuantity_gte,
      'plannedAtpQuantity_lte', plannedAtpQuantity_lte,
      'totalStockQuantity_eq', totalStockQuantity_eq,
      'totalStockQuantity_gt', totalStockQuantity_gt,
      'totalStockQuantity_lt', totalStockQuantity_lt,
      'totalStockQuantity_gte', totalStockQuantity_gte,
      'totalStockQuantity_lte', totalStockQuantity_lte,
      'inventoryAtpQuantity_eq', inventoryAtpQuantity_eq,
      'inventoryAtpQuantity_gt', inventoryAtpQuantity_gt,
      'inventoryAtpQuantity_lt', inventoryAtpQuantity_lt,
      'inventoryAtpQuantity_gte', inventoryAtpQuantity_gte,
      'inventoryAtpQuantity_lte', inventoryAtpQuantity_lte,
      'undamagedQuantity_eq', undamagedQuantity_eq,
      'undamagedQuantity_gt', undamagedQuantity_gt,
      'undamagedQuantity_lt', undamagedQuantity_lt,
      'undamagedQuantity_gte', undamagedQuantity_gte,
      'undamagedQuantity_lte', undamagedQuantity_lte,
      'currentAtpQuantity_eq', currentAtpQuantity_eq,
      'currentAtpQuantity_gt', currentAtpQuantity_gt,
      'currentAtpQuantity_lt', currentAtpQuantity_lt,
      'currentAtpQuantity_gte', currentAtpQuantity_gte,
      'currentAtpQuantity_lte', currentAtpQuantity_lte,
    );
    
    return {
      success: false,
      error: [`You did it. You managed to make an invalid payload by using criteria that don't match your API version. I hope you're happy.`],
    };
  }

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
    mandateParam(res, 'criteria', criteria, p => objHasAny(p, ['sku_eq', 'clientIdentifier_eq', 'clientIdentifier_in', 'warehouseIdentifier_eq', 'warehouseIdentifier_in', 'totalStockQuantity_eq', 'totalStockQuantity_gt', 'totalStockQuantity_lt', 'totalStockQuantity_gte', 'totalStockQuantity_lte', 'inventoryAtpQuantity_eq', 'inventoryAtpQuantity_gt', 'inventoryAtpQuantity_lt', 'inventoryAtpQuantity_gte', 'inventoryAtpQuantity_lte', 'plannedAtpQuantity_eq', 'plannedAtpQuantity_gt', 'plannedAtpQuantity_lt', 'plannedAtpQuantity_gte', 'plannedAtpQuantity_lte', 'undamagedQuantity_eq', 'undamagedQuantity_gt', 'undamagedQuantity_lt', 'undamagedQuantity_gte', 'undamagedQuantity_lte', 'currentAtpQuantity_eq', 'currentAtpQuantity_gt', 'currentAtpQuantity_lt', 'currentAtpQuantity_gte', 'currentAtpQuantity_lte'])),
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
// curl localhost:8000/logiwaReportGetAvailableToPromise -H "Content-Type: application/json" -d '{ "criteria": { "undamagedQuantity_gt": 1000, "options": { "apiVersion": "v3.2" } } }'