// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1TotalInventory~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const logiwaReportGetTotalInventory = async (
  {
    sku_eq,
    clientIdentifier_eq,
    clientIdentifier_in,
    outOfStock_eq,
    warehouseIdentifier_eq,
    warehouseIdentifier_in,
    productTypeName_eq,
    productGroupName_eq,
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
    ...(outOfStock_eq && { 'OutOfStock.eq': outOfStock_eq }),
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(warehouseIdentifier_in && { 'WarehouseIdentifier.in': warehouseIdentifier_in }),
    ...(productTypeName_eq && { 'ProductTypeName.eq': productTypeName_eq }),
    ...(productGroupName_eq && { 'ProductGroupName.eq': productGroupName_eq }),
  };

  const response = await logiwaGet(
    `/Report/TotalInventory/i/${ page }/s/${ perPage }`,
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

const logiwaReportGetTotalInventoryApi = async (req, res) => {
  const { 
    criteria,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'criteria', criteria, p => objHasAny(p, ['sku_eq', 'clientIdentifier_eq', 'clientIdentifier_in', 'outOfStock_eq', 'warehouseIdentifier_eq', 'warehouseIdentifier_in', 'productTypeName_eq', 'productGroupName_eq'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await logiwaReportGetTotalInventory(
    criteria,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaReportGetTotalInventory,
  logiwaReportGetTotalInventoryApi,
};

// curl localhost:8000/logiwaReportGetTotalInventory -H "Content-Type: application/json" -d '{ "criteria": { "outOfStock_eq": true } }'