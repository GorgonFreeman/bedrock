// https://developers.etsy.com/documentation/reference/#operation/getListingsByShop

const { respond, logDeep, credsByPath } = require('../utils');
const { etsyGet, etsyGetShopIdAndUserId } = require('../etsy/etsy.utils');

const etsyShopListingsGet = async (
  {
    credsPath,
    shopId,
    perPage,
    
    state, // "active" "inactive" "sold_out" "draft" "expired"
    sortOn, // "created" "price" "updated" "score"
    sortOrder, // "asc" "ascending" "desc" "descending" "up" "down"
    includes, // "Shipping" "Images" "Shop" "User" "Translations" "Inventory" "Videos"
    legacy,

    ...getterOptions
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

  const params = {
    ...(state && { state }),
    ...(sortOn && { sort_on: sortOn }),
    ...(sortOrder && { sort_order: sortOrder }),
    ...(includes && { includes }),
    ...(legacy && { legacy }),
    ...(perPage && { limit: perPage }),
  };

  const response = await etsyGet(
    `/application/shops/${ shopId }/listings`,
    { 
      params,
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
// curl localhost:8000/etsyShopListingsGet -H "Content-Type: application/json" -d '{ "options": { "state": "draft", "sort_on": "created", "sort_order": "desc" } }'