// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const shopifyMetafieldGet = async (
  credsPath,
  resource, // product, order, customer, etc.
  id,
  metafieldNameSpace,
  metafieldKey,
  {
  } = {},
) => {

  const response = await shopifyGetSingle(
    credsPath, 
    resource,
    id,
    {
      attrs: `
        id
        metafields (
          first: 10
          namespace: "${ metafieldNameSpace }"
        ) {
          edges {
            node {
              id
              key
              reference
              value
              type
            }
          }
        }
      `,
    },
  );

  if (!response.success) {
    console.log(`Error fetching metafield`);
    return {
      success: false,
      error: [`Error fetching metafield: ${ response.error }`],
    };
  }

  const metafield = response.result.metafields.find(metafield => metafield.key === metafieldKey);
  if (!metafield) {
    console.log(`Metafield ${ metafieldNameSpace } ${ metafieldKey } not found`);
    return {
      success: false,
      error: [`Metafield ${ metafieldNameSpace } ${ metafieldKey } not found: ${ response.error }`],
    };
  }
  return {
    success: true,
    result: metafield,
  };
};

const shopifyMetafieldGetApi = async (req, res) => {
  const { 
    credsPath,
    resource,
    id,
    metafieldNameSpace,
    metafieldKey,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyMetafieldGet(
    credsPath,
    resource,
    id,
    metafieldNameSpace,
    metafieldKey,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyMetafieldGet,
  shopifyMetafieldGetApi,
};

// curl localhost:8000/shopifyMetafieldGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "resource": "product", "id": "6977568178248", "metafieldNameSpace": "specifications", "metafieldKey": "ingredients" }'