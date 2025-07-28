const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17FulfillmentGet = async (
  {
    fulfillmentId,
    extFulfillmentId,
  },
  {
    credsPath,
  } = {},
) => {

  const fulfillmentIdentifier = fulfillmentId 
  || (extFulfillmentId ? `ext:${ extFulfillmentId }` : null);

  const response = await pipe17GetSingle(
    'fulfillment',
    fulfillmentIdentifier,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17FulfillmentGetApi = async (req, res) => {
  const { 
    fulfillmentIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'fulfillmentIdentifier', fulfillmentIdentifier),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17FulfillmentGet(
    fulfillmentIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17FulfillmentGet,
  pipe17FulfillmentGetApi,
};

// curl localhost:8000/pipe17FulfillmentGet -H "Content-Type: application/json" -d '{ "fulfillmentIdentifier": { "fulfillmentId": "4ce308990d48d54f" } }'
// curl localhost:8000/pipe17FulfillmentGet -H "Content-Type: application/json" -d '{ "fulfillmentIdentifier": { "extFulfillmentId": "b2a89a0e8d79e996:288133826938" } }'