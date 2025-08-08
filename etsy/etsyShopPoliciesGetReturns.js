const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGetShopIdAndUserId, etsyGet } = require('../etsy/etsy.utils');

const etsyShopPoliciesGetReturns = async (
  {
    credsPath,
    shopId,
  } = {},
) => {

  if (!shopId) {
    ({ shopId } = await etsyGetShopIdAndUserId({ credsPath, shopIdOnly: true }));
  }

  if (!shopId) {
    return {
      success: false,
      error: [`Shop ID is required`],
    };
  }

  const response = await etsyGet(`/application/shops/${ shopId }/policies/return`, { 
    context: {
      credsPath,
      withBearer: true,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopPoliciesGetReturnsApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'shopId', shopId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyShopPoliciesGetReturns(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopPoliciesGetReturns,
  etsyShopPoliciesGetReturnsApi,
};

// curl localhost:8000/etsyShopPoliciesGetReturns