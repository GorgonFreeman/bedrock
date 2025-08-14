// https://mydeveloper.logiwa.com/#tag/Inventory/paths/~1v3.1~1Inventory~1list~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const logiwaInventoriesGet = async (
  {
    credsPath,
    apiVersion = 'v3.1',

    page = 0,
    perPage = MAX_PER_PAGE,

    sku_eq,
    clientIdentifier_eq,
    warehouseIdentifier_eq,
    inventoryStatusId_eq,
    location_eq,
    useSnapshotData_eq,

    ...getterOptions
  } = {},
) => {

  const params = {
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(inventoryStatusId_eq && { 'InventoryStatusId.eq': inventoryStatusId_eq }),
    ...(location_eq && { 'Location.eq': location_eq }),
    ...(useSnapshotData_eq && { 'UseSnapshotData.eq': useSnapshotData_eq }),
  };

  const response = await logiwaGet(
    `/Inventory/list/i/${ page }/s/${ perPage }`,
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

const logiwaInventoriesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'orderId', orderId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await logiwaInventoriesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaInventoriesGet,
  logiwaInventoriesGetApi,
};

// curl localhost:8000/logiwaInventoriesGet
// curl localhost:8000/logiwaInventoriesGet -H "Content-Type: application/json" -d '{ "options": { "limit": 10 } }'