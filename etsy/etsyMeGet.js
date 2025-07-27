const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyMeGet = async (
  arg,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/things/${ arg }`,
    factoryArgs: [credsPath],
  });
  logDeep(response);
  return response;
};

const etsyMeGetApi = async (req, res) => {
  const { 
    arg,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'arg', arg),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyMeGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyMeGet,
  etsyMeGetApi,
};

// curl localhost:8000/etsyMeGet