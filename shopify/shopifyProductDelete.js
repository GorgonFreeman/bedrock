// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productDelete

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyProductDelete = async (
  credsPath,
  productId,
  {
    apiVersion,
  } = {},
) => {
  
  const mutationName = 'productDelete';

  const mutation = `
    mutation ${ mutationName }($input: ProductDeleteInput!) {
      ${ mutationName }(input: $input) {
        deletedProductId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: `gid://shopify/Product/${ productId }`,
    },
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    context: {
      credsPath,
      apiVersion,
    },
    interpreter: async (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result[mutationName],
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyProductDeleteApi = async (req, res) => {
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

  const result = await shopifyProductDelete(
    credsPath,
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyProductDelete,
  shopifyProductDeleteApi,
};

/*
curl -X POST \
  http://localhost:8000/shopifyProductDelete \
  -H 'Content-Type: application/json' \
  -d '{
    "credsPath": "au",
    "productId": "6980096196680",
    "options": {}
  }'
*/ 