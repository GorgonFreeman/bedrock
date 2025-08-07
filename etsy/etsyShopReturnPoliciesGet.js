const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopReturnPoliciesGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/policies/return`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopReturnPoliciesGetApi = async (req, res) => {
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

  const result = await etsyShopReturnPoliciesGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopReturnPoliciesGet,
  etsyShopReturnPoliciesGetApi,
};

// curl localhost:8000/etsyShopReturnPoliciesGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 