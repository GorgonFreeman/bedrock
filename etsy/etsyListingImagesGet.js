const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyListingImagesGet = async (
  listingId,
  {
    credsPath,
    perPage,
    ...getterOptions
  } = {},
) => {
  const response = await etsyGet(
    `/application/listings/${ listingId }/images`,
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
    listingId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'listingId', listingId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyListingImagesGet(
    listingId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingImagesGet,
  etsyListingImagesGetApi,
};

// curl localhost:8000/etsyListingImagesGet -H "Content-Type: application/json" -d '{ "listingId": "4314509353" }' 