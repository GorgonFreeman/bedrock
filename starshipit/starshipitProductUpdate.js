// https://api-docs.starshipit.com/#9101a9d7-91b1-492c-b7ad-5f92f80bbfd7

const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductUpdate = async (
  credsPath,
  productId,
  updatePayload,
  {
    // option,
  } = {},
) => {

  const response = await starshipitClient.fetch({
    url: '/products/update',
    method: 'put',
    body: {
      id: productId,
      product: updatePayload,
    },
    context: {
      credsPath,
    },
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.product,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const starshipitProductUpdateApi = funcApi(starshipitProductUpdate, {
  argNames: ['credsPath', 'productId', 'updatePayload', 'options'],
});

module.exports = {
  starshipitProductUpdate,
  starshipitProductUpdateApi,
};

// curl localhost:8000/starshipitProductUpdate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "productId": "408418809", "updatePayload": { "hs_code": "123456" } }' 