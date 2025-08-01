// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productUpdate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyProductUpdate = async (
  credsPath,
  productId,
  updatePayload,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {
  
  const mutationName = 'productUpdate';

  const mutation = `
    mutation ${ mutationName }($product: ProductUpdateInput!) {
      ${ mutationName }(product: $product) {
        product {
          ${ returnAttrs }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    product: {
      id: `gid://shopify/Product/${ productId }`,
      ...updatePayload,
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

const shopifyProductUpdateApi = async (req, res) => {
  const {
    credsPath,
    productId,
    updatePayload,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'productId', productId),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyProductUpdate(
    credsPath,
    productId,
    updatePayload,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyProductUpdate,
  shopifyProductUpdateApi,
};

/*
curl -X POST \
  http://localhost:8000/shopifyProductUpdate \
  -H 'Content-Type: application/json' \
  -d '{
    "credsPath": "au",
    "productId": "6980096196680",
    "updatePayload": {
      "title": "Updated Product Title",
      "tags": ["updated", "test"]
    },
    "options": {
      "returnAttrs": "id title handle"
    }
  }'
*/ 