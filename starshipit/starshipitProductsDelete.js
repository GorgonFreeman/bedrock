// https://api-docs.starshipit.com/#5edb43f1-432b-4d1a-bb31-e05db0c879e3

const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductsDelete = async (
  credsPath,
  productIds,
) => {

  const response = await starshipitClient.fetch({
    url: '/products/delete',
    method: 'delete',
    body: {
      product_ids: productIds,
    },
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const starshipitProductsDeleteApi = funcApi(starshipitProductsDelete, {
  argNames: ['credsPath', 'productIds'],
  validatorsByArg: {
    productIds: Array.isArray,
  },
});

module.exports = {
  starshipitProductsDelete,
  starshipitProductsDeleteApi,
};

// curl localhost:8000/starshipitProductsDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "productIds": [5585356] }'