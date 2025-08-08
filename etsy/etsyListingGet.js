// https://developers.etsy.com/documentation/reference/#operation/getListing

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingGet = async (
  listingId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/listings/${ listingId }`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingGetApi = async (req, res) => {
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

  const result = await etsyListingGet(
    listingId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingGet,
  etsyListingGetApi,
};

// curl localhost:8000/etsyListingGet -H "Content-Type: application/json" -d '{ "listingId": "4314509353" }' 