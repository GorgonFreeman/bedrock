// https://developers.etsy.com/documentation/reference/#operation/getShopReturnPolicies

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGetShopIdAndUserId, etsyGet } = require('../etsy/etsy.utils');

const etsyShopReturnsPoliciesGet = async (
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

const etsyShopReturnsPoliciesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'shopId', shopId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyShopReturnsPoliciesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopReturnsPoliciesGet,
  etsyShopReturnsPoliciesGetApi,
};

// curl localhost:8000/etsyShopReturnsPoliciesGet