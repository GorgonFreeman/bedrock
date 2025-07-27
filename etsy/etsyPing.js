const { respond, mandateParam, credsByPath, customAxios, logDeep } = require('../utils');

const etsyPing = async (
  {
    credsPath,
  } = {},
) => {

  const { 
    API_KEY,
    API_URL,
  } = credsByPath(['etsy', credsPath]);

  const url = `${ API_URL }/application/openapi-ping`;

  const headers = {
    'x-api-key': API_KEY,
  };

  // TODO: Implement bearer token

  const response = await customAxios(url, { headers });

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