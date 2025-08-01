const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyOrderFulfill = async (
  credsPath,
  orderId,
  {
    apiVersion,
    notifyCustomer,
    originAddress,
    trackingInfo,
  } = {},
) => {

  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        ${ attrs }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/Product/${ orderId }`,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    context: {
      credsPath,
      apiVersion,
    },
    interpreter: async (response) => {
      // console.log(response);
      return {
        ...response,
        ...response.result ? {
          result: response.result.product,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyOrderFulfillApi = async (req, res) => {
  const { 
    credsPath,
    orderId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyOrderFulfill(
    credsPath,
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyOrderFulfill,
  shopifyOrderFulfillApi,
};

/*
  curl localhost:8000/shopifyOrderFulfill \
    -H "Content-Type: application/json" \
    -d '{ 
      "credsPath": "au", 
      "orderId": "6993917280328", 
      "options": { 
        "notifyCustomer": false, 
        "originAddress": { 
          "countryCode": "AU" 
        }, 
        "trackingInfo": { 
          "number": "33VVY5069794010075115021965" 
        } 
      } 
    }'
*/