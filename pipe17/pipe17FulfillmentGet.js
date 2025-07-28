const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17FulfillmentGet = async (
  fulfillmentId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'fulfillment',
    fulfillmentId,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17FulfillmentGetApi = async (req, res) => {
  const { 
    fulfillmentId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'fulfillmentId', fulfillmentId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17FulfillmentGet(
    fulfillmentId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17FulfillmentGet,
  pipe17FulfillmentGetApi,
};

// curl localhost:8000/pipe17FulfillmentGet -H "Content-Type: application/json" -d '{ "fulfillmentId": "4ce308990d48d54f" }'