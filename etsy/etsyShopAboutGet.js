const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGetShopIdAndUserId, etsyClient } = require('../etsy/etsy.utils');

const etsyShopAboutGet = async (
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

  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/about`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopAboutGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'shopId', shopId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyShopAboutGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopAboutGet,
  etsyShopAboutGetApi,
};

// curl localhost:8000/etsyShopAboutGet