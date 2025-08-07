const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingOfferingGet = async (
  listingId,
  productId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/listings/${ listingId }/products/${ productId }/offerings`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingOfferingGetApi = async (req, res) => {
  const { 
    listingId,
    productId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'listingId', listingId),
    mandateParam(res, 'productId', productId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyListingOfferingGet(
    listingId,
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingOfferingGet,
  etsyListingOfferingGetApi,
};

// curl localhost:8000/etsyListingOfferingGet -H "Content-Type: application/json" -d '{ "listingId": "123456", "productId": "789" }' 