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
  const mutation = `
    mutation productUpdate($id: ID!, $input: ProductInput!) {
      productUpdate(id: $id, input: $input) {
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
    id: productId,
    input: updatePayload,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    factoryArgs: [credsPath, { apiVersion }],
    interpreter: async (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.productUpdate,
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
    "productId": "gid://shopify/Product/1234567890",
    "updatePayload": {
      "title": "Updated Product Title",
      "tags": ["updated", "test"]
    },
    "options": {
      "returnAttrs": "id title handle"
    }
  }'
*/ 