const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopReceiptsGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/receipts`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopReceiptsGetApi = async (req, res) => {
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

  const result = await etsyShopReceiptsGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopReceiptsGet,
  etsyShopReceiptsGetApi,
};

// curl localhost:8000/etsyShopReceiptsGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 