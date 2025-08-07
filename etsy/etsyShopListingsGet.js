const { respond, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyShopListingsGet = async (
  {
    credsPath,
    perPage,
    ...getterOptions
  } = {},
) => {
  const response = await etsyGet(
    '/application/listings/active',
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