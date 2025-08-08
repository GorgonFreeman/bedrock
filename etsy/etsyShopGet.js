// https://developers.etsy.com/documentation/reference/#operation/getShop

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGetShopIdAndUserId, etsyClient } = require('../etsy/etsy.utils');

const etsyShopGet = async (
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
    url: `/application/shops/${ shopId }`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'shopId', shopId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyShopGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopGet,
  etsyShopGetApi,
};

// curl localhost:8000/etsyShopGet