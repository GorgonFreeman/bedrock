const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyProductGet = async (
  credsPath,
  productId,
  {
    attrs = defaultAttrs,
    apiVersion,
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
    id: `gid://shopify/Product/${ productId }`,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    factoryArgs: [credsPath, { apiVersion }],
    interpreter: async (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.data.product,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyProductGetApi = async (req, res) => {
  const { 
    credsPath,
    productId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'productId', productId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyProductGet(
    credsPath,
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyProductGet,
  shopifyProductGetApi,
};

// curl localhost:8000/shopifyProductGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "productId": "6979774283848" }'