const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopPoliciesGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/policies`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopPoliciesGetApi = async (req, res) => {
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

  const result = await etsyShopPoliciesGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopPoliciesGet,
  etsyShopPoliciesGetApi,
};

// curl localhost:8000/etsyShopPoliciesGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 