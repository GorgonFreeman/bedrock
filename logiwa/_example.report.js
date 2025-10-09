// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1InventorySnapshot~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { funcApi, logDeep, objHasAny } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const FUNC = async (
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['criteria', 'options'],
  validatorsByArg: {
    criteria: (value) => objHasAny(value, ['warehouseIdentifier_eq', 'clientIdentifier_eq', 'locationIdentifier_eq', 'sku_eq', 'snapshotDate_bt']),
  },
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "criteria":{ "clientIdentifier_eq": "9f1ea39a-fccc-48af-8986-a35c34fcef8b" } }'