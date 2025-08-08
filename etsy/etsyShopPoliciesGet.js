const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGetShopIdAndUserId, etsyGet } = require('../etsy/etsy.utils');

const etsyShopPoliciesGet = async (
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

  const response = await etsyGet(`/application/shops/${ shopId }/policies`, { 
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopPoliciesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'shopId', shopId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyShopPoliciesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopPoliciesGet,
  etsyShopPoliciesGetApi,
};

// curl localhost:8000/etsyShopPoliciesGet