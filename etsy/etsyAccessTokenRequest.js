const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyAccessTokenRequest = async (
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/things/${ arg }`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyAccessTokenRequestApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyAccessTokenRequest(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyAccessTokenRequest,
  etsyAccessTokenRequestApi,
};

// curl localhost:8000/etsyAccessTokenRequest