const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopGetApi = async (req, res) => {
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

  const result = await etsyShopGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopGet,
  etsyShopGetApi,
};

// curl localhost:8000/etsyShopGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 