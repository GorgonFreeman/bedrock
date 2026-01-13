// https://apidoc.pipe17.com/#/operations/fetchOrder

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17OrderGet = async (
  {
    orderId,
    extOrderId,
    extOrderApiId,
  },
  {
    credsPath,
  } = {},
) => {

  const orderIdentifier = orderId 
  || (extOrderId ? `ext:${ extOrderId }` : null) 
  || (extOrderApiId ? `api:${ extOrderApiId }` : null);

  const response = await pipe17GetSingle(
    'order',
    orderIdentifier,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17OrderGetApi = async (req, res) => {
  const { 
    orderIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'orderIdentifier', orderIdentifier, objHasAny(orderIdentifier, ['orderId', 'extOrderId', 'extOrderApiId'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17OrderGet(
    orderIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17OrderGet,
  pipe17OrderGetApi,
};

// curl localhost:8000/pipe17OrderGet -H "Content-Type: application/json" -d '{ "orderIdentifier": { "orderId": "dc120f1015760357" } }'
// curl localhost:8000/pipe17OrderGet -H "Content-Type: application/json" -d '{ "orderIdentifier": { "extOrderApiId": "5964638257212" } }'

// Not sure why this doesn't work:
// curl localhost:8000/pipe17OrderGet -H "Content-Type: application/json" -d '{ "orderIdentifier": { "extOrderId": "#USA4392978" } }'