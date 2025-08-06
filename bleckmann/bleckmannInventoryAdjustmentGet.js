// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/INVENTORY/getAdjustmentForId

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannInventoryAdjustmentGet = async (
  adjustmentId,
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/inventory/adjustments/${ adjustmentId }`,
    // TODO: Consider implementing an interpreter to return result.data - unclear if one adjustmentId can return multiple results validly
  });

  logDeep(response);
  return response;
};

const bleckmannInventoryAdjustmentGetApi = async (req, res) => {
  const { 
    adjustmentId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'adjustmentId', adjustmentId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannInventoryAdjustmentGet(
    adjustmentId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannInventoryAdjustmentGet,
  bleckmannInventoryAdjustmentGetApi,
};

// curl localhost:8000/bleckmannInventoryAdjustmentGet -H "Content-Type: application/json" -d '{ "adjustmentId": "800821052.1" }'