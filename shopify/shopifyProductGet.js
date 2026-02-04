// https://shopify.dev/docs/api/admin-graphql/latest/queries/product

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');
const { shopifyProductsGet } = require('../shopify/shopifyProductsGet');

const defaultAttrs = `id title handle`;

const shopifyProductGet = async (
  credsPath,
  {
    productId,
    customId,
    handle,
    skuStartsWith,
  },
  {
    attrs = defaultAttrs,
    apiVersion,
  } = {},
) => {

  if (productId) {
    const response = await shopifyGetSingle(
      credsPath,
      'product',
      productId,
      {
        apiVersion,
        attrs,
      },
    );
  
    return response;
  }

  if (skuStartsWith) {

    attrs += ` exampleVariant: variants(first: 1, sortKey: SKU) { 
      edges { 
        node { 
          sku 
        } 
      } 
    }`;
    
    const productsResponse = await shopifyProductsGet(
      credsPath,
      {
        queries: [`sku:${ skuStartsWith }*`],
        attrs,
        apiVersion,
      },
    );

    const { success: productsSuccess, result: products } = productsResponse;
    if (!productsSuccess) {
      return productsResponse;
    }

    const productCandidates = products.filter(p => p.exampleVariant?.[0]?.sku?.startsWith(skuStartsWith));

    if (productCandidates.length === 0) {
      return {
        success: false,
        error: [`No products found with sku starting with '${ skuStartsWith }'`],
      };
    }
    if (productCandidates.length > 1) {
      return {
        success: false,
        error: [`Multiple products found with sku starting with '${ skuStartsWith }'. Please refine your partial sku.`],
      };
    }

    const productCandidate = productCandidates[0];

    const {
      exampleVariant,
      ...product
    } = productCandidate;

    return {
      success: true,
      result: product,
    };
  }

  const query = `
    query GetProductByIdentifier ($identifier: ProductIdentifierInput!) {
      product: productByIdentifier(identifier: $identifier) {
        ${ attrs }      } 
    }
  `;

  const variables = {
    identifier: {
      ...customId && { customId },
      ...handle && { handle },
    },
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    context: {
      credsPath,
      apiVersion,
    },
  });

  return response;  
};

const shopifyProductGetApi = async (req, res) => {
  const { 
    credsPath,
    productIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'productIdentifier', productIdentifier, p => objHasAny(p, ['productId', 'customId', 'handle'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyProductGet(
    credsPath,
    productIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyProductGet,
  shopifyProductGetApi,
};

// curl localhost:8000/shopifyProductGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "productIdentifier": { "productId": "6983241564232" } }'
// curl localhost:8000/shopifyProductGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "productIdentifier": { "handle": "forever-is-ours-baby-tee-cupcake" } }'
// curl localhost:8000/shopifyProductGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "productIdentifier": { "skuStartsWith": "EXDAL2376-1-" } }'