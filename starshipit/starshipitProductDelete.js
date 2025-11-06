// https://api-docs.starshipit.com/#5edb43f1-432b-4d1a-bb31-e05db0c879e3

const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductDelete = async (
  credsPath,
  productId,
) => {

  const response = await starshipitClient.fetch({
    url: '/products/delete',
    method: 'delete',
    body: {
      product_ids: [productId],
    },
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const starshipitProductDeleteApi = funcApi(starshipitProductDelete, {
  argNames: ['credsPath', 'productId'],
});

module.exports = {
  starshipitProductDelete,
  starshipitProductDeleteApi,
};

// curl localhost:8000/starshipitProductDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "productId": "5585356" }'