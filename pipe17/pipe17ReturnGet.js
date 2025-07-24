const { respond, mandateParam, credsByPath } = require('../utils');

const pipe17ReturnGet = async (
  returnId,
  {
    credsPath,
  } = {},
) => {

  const creds = credsByPath(['pipe17', credsPath]);

  return creds;
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