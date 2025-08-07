const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyMeGet = async (
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: '/application/users/me',
    context: {
      credsPath,
      withBearer: true,
    },
  });
  logDeep(response);
  return response;
};

const etsyMeGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyMeGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyMeGet,
  etsyMeGetApi,
};

// curl localhost:8000/etsyMeGet