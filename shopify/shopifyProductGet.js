const { respond, mandateParam, credsByPath, customAxios, logDeep } = require('../utils');

const defaultAttrs = `id title handle`;

const shopifyProductGet = async (
  credsPath,
  productId,
  {
    attrs = defaultAttrs,
  } = {},
) => {

  const creds = credsByPath(['shopify', credsPath]);

  const { STORE_URL, SHOPIFY_API_KEY } = creds;

  const apiVersion = '2025-10';

  const url = `https://${ STORE_URL }.myshopify.com/admin/api/${ apiVersion }/graphql.json`;
  
  const headers = {
    'X-Shopify-Access-Token': SHOPIFY_API_KEY,
    'Content-Type': 'application/json',
  };

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

  const response = await customAxios(url, {
    method: 'post',
    headers,
    body: { query, variables },
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