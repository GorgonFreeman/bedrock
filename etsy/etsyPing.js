const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyPing = async (
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: '/application/openapi-ping',
    factoryArgs: [credsPath],
  });
  logDeep(response);
  return response;
};

const etsyPingApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyPing(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyPing,
  etsyPingApi,
};

// curl localhost:8000/etsyPing