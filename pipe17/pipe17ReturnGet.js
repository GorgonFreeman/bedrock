// https://apidoc.pipe17.com/#/operations/fetchReturn

const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17ReturnGet = async (
  returnId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'return',
    returnId,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17ReturnGetApi = async (req, res) => {
  const { 
    returnId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'returnId', returnId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17ReturnGet(
    returnId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ReturnGet,
  pipe17ReturnGetApi,
};

// curl localhost:8000/pipe17ReturnGet -H "Content-Type: application/json" -d '{ "returnId": "969504fc181f7182" }'