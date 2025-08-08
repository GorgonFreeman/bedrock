// https://developers.etsy.com/documentation/reference/#operation/getReviewsByShop

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopReviewsGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/reviews`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopReviewsGetApi = async (req, res) => {
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

  const result = await etsyShopReviewsGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopReviewsGet,
  etsyShopReviewsGetApi,
};

// curl localhost:8000/etsyShopReviewsGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 