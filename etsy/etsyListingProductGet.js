const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingProductGet = async (
  listingId,
  productId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/listings/${ listingId }/products/${ productId }`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingProductGetApi = async (req, res) => {
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

  const result = await etsyListingProductGet(
    listingId,
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingProductGet,
  etsyListingProductGetApi,
};

// curl localhost:8000/etsyListingProductGet -H "Content-Type: application/json" -d '{ "listingId": "123456", "productId": "789" }' 