const { funcApi, logDeep } = require('../utils');
const { starshipitProductsGet } = require('../starshipit/starshipitProductsGet');
const { starshipitProductsDelete } = require('../starshipit/starshipitProductsDelete');

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

  const duplicateGroups = Array.from(Object.values(productsBySku)).filter((products) => products.length > 1);

  const productIdsToDelete = [];

  for (const duplicateGroup of duplicateGroups) {

    const [bestProduct, ...duplicateProducts] = duplicateGroup.sort((a, b) => {
      return Object.keys(b).length - Object.keys(a).length;
    });

    // delete duplicate products
    productIdsToDelete.push(duplicateProducts.map(p => p.id));
  }

  console.log(`${ productIdsToDelete.length } duplicates found`);

  const deleteResponse = await starshipitProductsDelete(credsPath, productIdsToDelete);

  logDeep(deleteResponse);
  return deleteResponse;
};

const starshipitProductsDeduplicateApi = funcApi(starshipitProductsDeduplicate, {
  argNames: ['credsPath'],
});

module.exports = {
  starshipitProductsDeduplicate,
  starshipitProductsDeduplicateApi,
};

// curl localhost:8000/starshipitProductsDeduplicate -H "Content-Type: application/json" -d '{ "credsPath": "wf" }' 