// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1InventorySnapshot~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const logiwaReportGetInventorySnapshot = async (
  {
    warehouseIdentifier_eq,
    clientIdentifier_eq,
    locationIdentifier_eq,
    sku_eq,
    snapshotDate_bt,
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
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(locationIdentifier_eq && { 'LocationIdentifier.eq': locationIdentifier_eq }),
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(snapshotDate_bt && { 'SnapshotDate.bt': snapshotDate_bt }),
  };

  const response = await logiwaGet(
    `/Report/InventorySnapshot/i/${ page }/s/${ perPage }`,
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

const logiwaReportGetInventorySnapshotApi = async (req, res) => {
  const { 
    criteria,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'criteria', criteria, p => objHasAny(p, ['warehouseIdentifier_eq', 'clientIdentifier_eq', 'locationIdentifier_eq', 'sku_eq', 'snapshotDate_bt'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await logiwaReportGetInventorySnapshot(
    criteria,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaReportGetInventorySnapshot,
  logiwaReportGetInventorySnapshotApi,
};

// curl localhost:8000/logiwaReportGetInventorySnapshot -H "Content-Type: application/json" -d '{ "criteria":{ "clientIdentifier_eq": "9f1ea39a-fccc-48af-8986-a35c34fcef8b" } }'