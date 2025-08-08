// https://developers.etsy.com/documentation/reference/#operation/getListingsByShopSectionId

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopSectionListingsGet = async (
  shopId,
  sectionId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/sections/${ sectionId }/listings/active`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopSectionListingsGetApi = async (req, res) => {
  const { 
    shopId,
    sectionId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'shopId', shopId),
    mandateParam(res, 'sectionId', sectionId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyShopSectionListingsGet(
    shopId,
    sectionId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopSectionListingsGet,
  etsyShopSectionListingsGetApi,
};

// curl localhost:8000/etsyShopSectionListingsGet -H "Content-Type: application/json" -d '{ "shopId": "123456", "sectionId": "789" }' 