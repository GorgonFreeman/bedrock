// https://developers.etsy.com/documentation/reference/#operation/getShopShippingProfiles

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopShippingPoliciesGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/policies/shipping`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopShippingPoliciesGetApi = async (req, res) => {
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

  const result = await etsyShopShippingPoliciesGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopShippingPoliciesGet,
  etsyShopShippingPoliciesGetApi,
};

// curl localhost:8000/etsyShopShippingPoliciesGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 