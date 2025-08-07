const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingVariationsGet = async (
  listingId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/listings/${ listingId }/variations`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingVariationsGetApi = async (req, res) => {
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

  const result = await etsyListingVariationsGet(
    listingId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingVariationsGet,
  etsyListingVariationsGetApi,
};

// curl localhost:8000/etsyListingVariationsGet -H "Content-Type: application/json" -d '{ "listingId": "123456" }' 