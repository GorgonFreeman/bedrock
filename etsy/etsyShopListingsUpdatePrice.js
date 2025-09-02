const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopListingsUpdatePrice = async (
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

const etsyShopListingsUpdatePriceApi = async (req, res) => {
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

  const result = await etsyShopListingsUpdatePrice(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopListingsUpdatePrice,
  etsyShopListingsUpdatePriceApi,
};

// curl localhost:8000/etsyShopListingsUpdatePrice