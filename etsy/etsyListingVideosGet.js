// https://developers.etsy.com/documentation/reference/#operation/getListingVideos

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyListingVideosGet = async (
  listingId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyGet(
    `/application/listings/${ listingId }/videos`,
    { 
      context: {
        credsPath,
      },
    },
  );
  logDeep(response);
  return response;
};

const etsyListingVideosGetApi = async (req, res) => {
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

  const result = await etsyListingVideosGet(
    listingId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingVideosGet,
  etsyListingVideosGetApi,
};

// curl localhost:8000/etsyListingVideosGet -H "Content-Type: application/json" -d '{ "listingId": "4314509353" }' 