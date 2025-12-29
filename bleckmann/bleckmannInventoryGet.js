// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/INVENTORY/getInventoryForId

const { respond, mandateParam, logDeep, actionMultipleOrSingle } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannInventoryGetSingle = async (
  sku,
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/warehousing/inventory/${ encodeURIComponent(sku) }`,
  });

  return response;
};

const bleckmannInventoryGet = async (
  sku,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    sku,
    bleckmannInventoryGetSingle,
    (sku) => ({
      args: [sku],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const bleckmannInventoryGetApi = async (req, res) => {
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

  const result = await bleckmannInventoryGet(
    sku,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannInventoryGet,
  bleckmannInventoryGetApi,
};

// curl localhost:8000/bleckmannInventoryGet -H "Content-Type: application/json" -d '{ "sku": "EXD1224-3-3XS/XXS" }'
// curl localhost:8000/bleckmannInventoryGet -H "Content-Type: application/json" -d '{ "sku": ["EXD1224-3-3XS/XXS", "EXD1225-1-S/M"] }'