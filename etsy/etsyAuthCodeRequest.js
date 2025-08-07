const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyAuthCodeRequest = async (
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

const etsyAuthCodeRequestApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyAuthCodeRequest(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyAuthCodeRequest,
  etsyAuthCodeRequestApi,
};

// curl localhost:8000/etsyAuthCodeRequest