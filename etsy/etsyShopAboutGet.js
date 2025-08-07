const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopAboutGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/about`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopAboutGetApi = async (req, res) => {
  const { 
    shopId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'shopId', shopId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyShopAboutGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopAboutGet,
  etsyShopAboutGetApi,
};

// curl localhost:8000/etsyShopAboutGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 