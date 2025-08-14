// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1InventoryCalculation~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const logiwaReportGetInventoryCalculation = async (
  warehouseIdentifier_eq,
  {
    credsPath,
    apiVersion = 'v3.1',

    page = 0,
    perPage = MAX_PER_PAGE,

    ...getterOptions
  } = {},
) => {

  const params = {
    'WarehouseIdentifier.eq': warehouseIdentifier_eq,
  };

  const response = await logiwaGet(
    `/Report/InventoryCalculation/i/${ page }/s/${ perPage }`,
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

const logiwaReportGetInventoryCalculationApi = async (req, res) => {
  const { 
    warehouseIdentifier_eq,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'warehouseIdentifier_eq', warehouseIdentifier_eq),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await logiwaReportGetInventoryCalculation(
    warehouseIdentifier_eq,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaReportGetInventoryCalculation,
  logiwaReportGetInventoryCalculationApi,
};

// curl localhost:8000/logiwaReportGetInventoryCalculation -H "Content-Type: application/json" -d '{ "warehouseIdentifier_eq": "c347b530-a9cd-45e7-b07e-f3f51d553f47" }'