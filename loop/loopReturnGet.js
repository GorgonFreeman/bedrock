// https://docs.loopreturns.com/api-reference/latest/return-data/get-return-details

const { respond, mandateParam, logDeep, standardInterpreters, objHasAny } = require('../utils');
const { loopClient } = require('../loop/loop.utils');

const loopReturnGet = async (
  credsPath,
  {
    returnId,
    orderId,
    orderName,
  },
) => {

  const params = {
    ...(returnId ? { return_id: returnId } : {}),
    ...(orderId ? { order_id: orderId } : {}),
    ...(orderName ? { order_name: orderName } : {}),
  };

  const response = await loopClient.fetch({
    url: `/warehouse/return/details`,
    params,
    context: {
      credsPath,
    },
    ...(returnId ? { interpreter: standardInterpreters.expectOne } : {}),
  });
  
  logDeep(response);
  return response;
};

const loopReturnGetApi = async (req, res) => {
  const { 
    credsPath,
    returnIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'returnIdentifier', returnIdentifier, p => objHasAny(p, ['returnId', 'orderId', 'orderName'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await loopReturnGet(
    credsPath,
    returnIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopReturnGet,
  loopReturnGetApi,
};

// curl localhost:8000/loopReturnGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "returnIdentifier": { "returnId": "85747906" } }'