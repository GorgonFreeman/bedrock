// https://developers.etsy.com/documentation/reference/#operation/getShopReceipts

const { respond, logDeep } = require('../utils');
const { etsyGet, etsyGetShopIdAndUserId } = require('../etsy/etsy.utils');

const etsyReceiptsGet = async (
  {
    credsPath,
    shopId,
    perPage,
    ...getterOptions
  } = {},
) => {

  if (!shopId) {
    const shopIdAndUserId = await etsyGetShopIdAndUserId({ credsPath, shopIdOnly: true });
    ({ shopId } = shopIdAndUserId);
  }

  if (!shopId) {
    return {
      success: false,
      error: ['Shop ID not found'],
    };
  }

  const response = await etsyGet(
    `/application/shops/${ shopId }/receipts`,
    { 
      context: {
        credsPath,
        withBearer: true,
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const etsyReceiptsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyReceiptsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyReceiptsGet,
  etsyReceiptsGetApi,
};

// curl localhost:8000/etsyReceiptsGet 
// curl localhost:8000/etsyReceiptsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 600 } }'