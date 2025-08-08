const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyListingReviewsGet = async (
  listingId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyGet(`/application/listings/${ listingId }/reviews`, { 
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingReviewsGetApi = async (req, res) => {
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

  const result = await etsyListingReviewsGet(
    listingId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingReviewsGet,
  etsyListingReviewsGetApi,
};

// curl localhost:8000/etsyListingReviewsGet -H "Content-Type: application/json" -d '{ "listingId": "1849645522" }' 