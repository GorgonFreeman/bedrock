// https://developers.etsy.com/documentation/reference/#operation/getShopSections

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopSectionsGet = async (
  shopId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/sections`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopSectionsGetApi = async (req, res) => {
  const { 
    shopId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'shopId', shopId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyShopSectionsGet(
    shopId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopSectionsGet,
  etsyShopSectionsGetApi,
};

// curl localhost:8000/etsyShopSectionsGet -H "Content-Type: application/json" -d '{ "shopId": "123456" }' 