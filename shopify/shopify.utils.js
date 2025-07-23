const { credsByPath } = require('../utils');

const shopifyRequestSetup = (
  credsPath,
  { 
    apiVersion = '2025-10', 
  } = {},
) => {
  // returns { baseUrl, headers }
  
  const creds = credsByPath(['shopify', credsPath]);

  const { STORE_URL, SHOPIFY_API_KEY } = creds;

  const baseUrl = `https://${ STORE_URL }.myshopify.com/admin/api/${ apiVersion }/graphql.json`;
  const headers = {
    'X-Shopify-Access-Token': SHOPIFY_API_KEY,
  };

  return { 
    baseUrl,
    headers,
  }; 
};

module.exports = {
  shopifyRequestSetup,
};