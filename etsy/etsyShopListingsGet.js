const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopListingsGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/listings/active`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopListingsGetApi = async (req, res) => {
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

  const result = await etsyShopListingsGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopListingsGet,
  etsyShopListingsGetApi,
};

// curl localhost:8000/etsyShopListingsGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 