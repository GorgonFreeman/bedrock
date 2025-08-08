// https://developers.etsy.com/documentation/reference/#operation/updateListingInventory

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyListingInventoryUpdate = async (
  listingId, 
  updatePayload = {},
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/listings/${ listingId }/inventory`,
    method: 'put',
    context: {
      credsPath,
      withBearer: true,
    },
    body: updatePayload,
  });
  logDeep(response);
  return response;
};

const etsyListingInventoryUpdateApi = async (req, res) => {
  const { 
    listingId,
    updatePayload,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'listingId', listingId),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyListingInventoryUpdate(
    listingId,
    updatePayload,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingInventoryUpdate,
  etsyListingInventoryUpdateApi,
};

// curl localhost:8000/etsyListingInventoryUpdate -H "Content-Type: application/json" -d '{ "listingId": "123456", "updatePayload": { ... } }' 