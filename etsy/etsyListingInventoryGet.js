const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingInventoryGet = async (
  listingId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/listings/${ listingId }/inventory`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingInventoryGetApi = async (req, res) => {
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

  const result = await etsyListingInventoryGet(
    listingId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingInventoryGet,
  etsyListingInventoryGetApi,
};

// curl localhost:8000/etsyListingInventoryGet -H "Content-Type: application/json" -d '{ "listingId": "123456" }' 