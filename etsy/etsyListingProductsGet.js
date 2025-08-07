const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingProductsGet = async (
  listingId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/listings/${ listingId }/products`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingProductsGetApi = async (req, res) => {
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

  const result = await etsyListingProductsGet(
    listingId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingProductsGet,
  etsyListingProductsGetApi,
};

// curl localhost:8000/etsyListingProductsGet -H "Content-Type: application/json" -d '{ "listingId": "123456" }' 