const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopPrivacyPoliciesGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/policies/privacy`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopPrivacyPoliciesGetApi = async (req, res) => {
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

  const result = await etsyShopPrivacyPoliciesGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopPrivacyPoliciesGet,
  etsyShopPrivacyPoliciesGetApi,
};

// curl localhost:8000/etsyShopPrivacyPoliciesGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 