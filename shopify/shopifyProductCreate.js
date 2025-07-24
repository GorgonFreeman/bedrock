const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyProductCreate = async (
  credsPath,
  productInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {
  const mutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
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
    input: productInput,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    factoryArgs: [credsPath, { apiVersion }],
    interpreter: async (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.productCreate,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyProductCreateApi = async (req, res) => {
  const {
    credsPath,
    productInput,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'productInput', productInput),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyProductCreate(
    credsPath,
    productInput,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyProductCreate,
  shopifyProductCreateApi,
};

/*
curl -X POST \
  http://localhost:8000/shopifyProductCreate \
  -H 'Content-Type: application/json' \
  -d '{
    "credsPath": "au",
    "productInput": {
      "title": "Test Product",
      "descriptionHtml": "<strong>Good product!</strong>",
      "vendor": "Test Vendor",
      "tags": ["example", "test"]
    },
    "options": {
      "returnAttrs": "id title handle"
    }
  }'
*/