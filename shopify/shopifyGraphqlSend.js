const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyGraphqlSend = async (
  credsPath,
  query,
  {
    apiVersion,
    variables = {},
  } = {},
) => {

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    context: {
      credsPath,
      apiVersion,
    },
  });

  logDeep(response);
  return response;
};

const shopifyGraphqlSendApi = funcApi(shopifyGraphqlSend, {
  argNames: ['credsPath', 'query'],
});

module.exports = {
  shopifyGraphqlSend,
  shopifyGraphqlSendApi,
};

// curl localhost:8000/shopifyGraphqlSend \
//   -H "Content-Type: application/json" \
//   -d '{
//     "credsPath": "au",
//     "query": "mutation {\n  deliveryCustomizationCreate(\n    deliveryCustomization: {\n      functionId: \"0199ad76-78bb-773e-a22c-fd15a476d93b\",\n      title: \"Hide delivery options for dangerous goods\",\n      enabled: true\n    }\n  ) {\n    deliveryCustomization {\n      id\n    }\n    userErrors {\n      message\n    }\n  }\n}"
//   }'