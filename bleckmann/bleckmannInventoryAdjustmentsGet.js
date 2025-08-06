// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/SKU/getSkuForId

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannInventoryAdjustmentsGet = async (
  sku,
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/skus/${ encodeURIComponent(sku) }`,
  });

  logDeep(response);
  return response;
};

const bleckmannInventoryAdjustmentsGetApi = async (req, res) => {
  const { 
    sku,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'sku', sku),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannInventoryAdjustmentsGet(
    sku,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannInventoryAdjustmentsGet,
  bleckmannInventoryAdjustmentsGetApi,
};

// curl localhost:8000/bleckmannInventoryAdjustmentsGet -H "Content-Type: application/json" -d '{ "sku": "EXD1224-3-3XS/XXS" }'