const { respond, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyListingImagesGet = async (
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

const etsyListingImagesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyListingImagesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingImagesGet,
  etsyListingImagesGetApi,
};

// curl localhost:8000/etsyListingImagesGet 
// curl localhost:8000/etsyListingImagesGet -H "Content-Type: application/json" -d '{ "options": { "limit": 600 } }'