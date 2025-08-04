const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17OrderGet = async (
  orderId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'order',
    orderId,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17OrderGetApi = async (req, res) => {
  const { 
    orderId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17OrderGet(
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17OrderGet,
  pipe17OrderGetApi,
};

// curl localhost:8000/pipe17OrderGet -H "Content-Type: application/json" -d '{ "orderId": "5964638257212" }'