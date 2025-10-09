// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/SKU/getSkuForId

const { funcApi, logDeep } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const FUNC = async (
  sku,
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/skus/${ encodeURIComponent(sku) }`,
  });

  logDeep(response);
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['sku', 'options'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "sku": "EXD1224-3-3XS/XXS" }'