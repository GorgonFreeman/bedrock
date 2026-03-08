const { funcApi, logDeep, customAxios, credsByPath } = require('../utils');

const shopifyCountriesGet = async (
  store,
) => {
 
  const creds = credsByPath(['shopify', store]);
  const { STORE_URL } = creds;

  const response = await customAxios(`https://${ STORE_URL }.myshopify.com/services/countries.json`, {
    method: 'get',
  });

  logDeep(response);
  return response;
};

const shopifyCountriesGetApi = funcApi(shopifyCountriesGet, {
  argNames: ['store'],
});

module.exports = {
  shopifyCountriesGet,
  shopifyCountriesGetApi,
};

// curl localhost:8000/shopifyCountriesGet -H "Content-Type: application/json" -d '{ "store": "au" }'