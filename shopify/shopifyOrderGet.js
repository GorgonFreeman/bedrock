// https://shopify.dev/docs/api/admin-graphql/latest/queries/order

const { respond, mandateParam, logDeep, objHasAny, standardInterpreters } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const defaultAttrs = `id name`;

const shopifyOrderGet = async (
  credsPath,
  {
    orderId,
    orderName,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  if (orderId) {
    const response = await shopifyGetSingle(
      credsPath,
      'order',
      orderIdentifier,
      {
        apiVersion,
        attrs,
      },
    );
  
    logDeep(response);
    return response;
  }

  /* orderName */
  const response = await shopifyOrdersGet(credsPath, {
    apiVersion,
    attrs,
    queries: [`name:${ orderName }`],
  });

  const singleResponse = standardInterpreters.expectOne(response);

  logDeep(singleResponse);
  return singleResponse;
  /* /orderName */
};

const shopifyOrderGetApi = async (req, res) => {
  const { 
    credsPath,
    orderIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderIdentifier', orderIdentifier, p => objHasAny(p, ['orderId', 'orderName'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyOrderGet(
    credsPath,
    orderIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyOrderGet,
  shopifyOrderGetApi,
};

// curl localhost:8000/shopifyOrderGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "orderIdentifier": { "orderId": "7015155466312" } }'
// curl localhost:8000/shopifyOrderGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "orderIdentifier": { "orderName": "#AUS5492283" } }'