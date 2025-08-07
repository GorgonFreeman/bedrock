const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyAccessTokenRefresh = async (
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

const etsyAccessTokenRefreshApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyAccessTokenRefresh(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyAccessTokenRefresh,
  etsyAccessTokenRefreshApi,
};

// curl localhost:8000/etsyAccessTokenRefresh