const { respond, mandateParam, logDeep } = require('../utils');
const { loopGet } = require('../loop/loop.utils');

const loopReturnsGet = async (
  credsPath,
  {
    option,
  } = {},
) => {

  const response = await loopGet(
    credsPath,
    '/warehouse/return/list',
    {
      // params: {
      //   ...options,
      // },
    },
  );
  logDeep(response);
  return response;
};

const loopReturnsGetApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await loopReturnsGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopReturnsGet,
  loopReturnsGetApi,
};

// curl localhost:8000/loopReturnsGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'