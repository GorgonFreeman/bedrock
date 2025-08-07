// https://developers.etsy.com/documentation/reference/#operation/getListingsByShop

const { respond, logDeep, credsByPath } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyShopListingsGet = async (
  {
    credsPath,
    shopId,
    perPage,
    ...getterOptions
  } = {},
) => {
  
  if (!shopId) {
    const creds = credsByPath(['etsy', credsPath]);
    const { SHOP_ID } = creds;
    shopId = SHOP_ID;
  }

  if (!shopId) {
    return {
      success: false,
      error: [`Shop ID is required`],
    };
  }

  const response = await etsyGet(
    `/application/shops/${ shopId }/listings`,
    { 
      context: {
        credsPath,
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const etsyShopListingsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyShopListingsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopListingsGet,
  etsyShopListingsGetApi,
};

// curl localhost:8000/etsyShopListingsGet 
// curl localhost:8000/etsyShopListingsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 600 } }'