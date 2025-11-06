const { funcApi, logDeep } = require('../utils');
const { starshipitProductsGet } = require('../starshipit/starshipitProductsGet');

const starshipitProductsDeduplicate = async (
  credsPath,
) => {

  const starshipitProductsResponse = await starshipitProductsGet(credsPath);

  const { 
    success: starshipitProductsSuccess, 
    result: starshipitProducts,
  } = starshipitProductsResponse;

  if (!starshipitProductsSuccess) {
    return starshipitProductsResponse;
  }

  const productsBySku = {};
  
  for (const starshipitProduct of starshipitProducts) {
    const { sku } = starshipitProduct;

    if (!sku) {
      continue;
    }

    productsBySku[sku] = productsBySku[sku] || [];
    productsBySku[sku].push(starshipitProduct);
  }

  logDeep(productsBySku);
  return productsBySku;
};

const starshipitProductsDeduplicateApi = funcApi(starshipitProductsDeduplicate, {
  argNames: ['credsPath'],
});

module.exports = {
  starshipitProductsDeduplicate,
  starshipitProductsDeduplicateApi,
};

// curl localhost:8000/starshipitProductsDeduplicate -H "Content-Type: application/json" -d '{ "credsPath": "wf" }' 