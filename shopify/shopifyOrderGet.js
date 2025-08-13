// https://shopify.dev/docs/api/admin-graphql/latest/queries/order

const { respond, mandateParam, logDeep, objHasAny, standardInterpreters, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const defaultAttrs = `id name`;

const shopifyOrderGetSingle = async (
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
      orderId,
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

const shopifyOrderGet = async (
  credsPath,
  orderIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    orderIdentifier,
    shopifyOrderGetSingle,
    (orderIdentifier) => ({
      args: [credsPath, orderIdentifier],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
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
// curl localhost:8000/shopifyOrderGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "orderIdentifier": [{ "orderId": "7015155466312" }, { "orderName": "#AUS5492283" }] }'