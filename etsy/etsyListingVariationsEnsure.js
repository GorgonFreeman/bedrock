const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingVariationsEnsure = async (
  arg,
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

const etsyListingVariationsEnsureApi = async (req, res) => {
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

  const result = await etsyListingVariationsEnsure(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingVariationsEnsure,
  etsyListingVariationsEnsureApi,
};

// curl localhost:8000/etsyListingVariationsEnsure