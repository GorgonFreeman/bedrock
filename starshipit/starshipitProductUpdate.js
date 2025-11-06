// https://api-docs.starshipit.com/#9101a9d7-91b1-492c-b7ad-5f92f80bbfd7

const { funcApi, logDeep, askQuestion } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');
const { starshipitProductGet } = require('../starshipit/starshipitProductGet');

const starshipitProductUpdate = async (
  credsPath,
  productId,
  sku,
  updatePayload,
  {
    setData = false, // Note: This API method sets the entire product data by default, so without this option, we fetch and preserve the data first.
  } = {},
) => {

  if (!setData) {
    const productResponse = await starshipitProductGet(credsPath, sku);

    const { success, result } = productResponse;

    if (!success) {
      return productResponse;
    }

    // logDeep('before', updatePayload);

    const currentData = result;
    updatePayload = {
      ...currentData,
      ...updatePayload,
    };

    // logDeep('after', updatePayload);

    // await askQuestion('Continue?');
  }

  const response = await starshipitClient.fetch({
    url: '/products/update',
    method: 'put',
    body: {
      id: productId,
      product: {
        id: productId,
        sku,
        ...updatePayload,
      },
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
  argNames: ['credsPath', 'productId', 'sku', 'updatePayload', 'options'],
});

module.exports = {
  starshipitProductUpdate,
  starshipitProductUpdateApi,
};

// curl localhost:8000/starshipitProductUpdate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "productId": "3015817", "sku": "WFAL48-1-S", "updatePayload": { "hs_code": "6104630011" } }'