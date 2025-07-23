const { credsByPath, CustomAxiosClient, stripEdgesAndNodes } = require('../utils');

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

const shopifyClient = new CustomAxiosClient({
  factory: shopifyRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: (response) => {
    // console.log(response);
    const strippedResponse = stripEdgesAndNodes(response);
    // TODO: strip edges and nodes
    return {
      ...strippedResponse,
      ...strippedResponse.result ? {
        result: strippedResponse.result.data,
      } : {},
    };
  },
});

module.exports = {
  shopifyClient,
};