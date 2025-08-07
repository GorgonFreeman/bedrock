const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingShippingGet = async (
  listingId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/listings/${ listingId }/shipping`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingShippingGetApi = async (req, res) => {
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

  const result = await etsyListingShippingGet(
    listingId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingShippingGet,
  etsyListingShippingGetApi,
};

// curl localhost:8000/etsyListingShippingGet -H "Content-Type: application/json" -d '{ "listingId": "123456" }' 