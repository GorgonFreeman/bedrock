const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17ReturnGet = async (
  returnId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17Client.fetch({
    url: `/returns/${ returnId }`,
    factoryArgs: [credsPath],
    // TODO: Implement base interpreter to handle pipe17's own success node
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.return,
        } : {},
      };
    },
  });
  
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