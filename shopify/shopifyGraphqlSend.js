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
  argNames: ['credsPath', 'query', 'options'],
});

module.exports = {
  shopifyGraphqlSend,
  shopifyGraphqlSendApi,
};

/*
curl localhost:8000/shopifyGraphqlSend \
  -H "Content-Type: application/json" \
  -d '{
    "credsPath": "uk.tender",
    "query": "mutation { deliveryCustomizationCreate(deliveryCustomization: { functionId: \"0199ad76-78bb-773e-a22c-fd15a476d93b\", title: \"Hide delivery options for dangerous goods\", enabled: true }) { deliveryCustomization { id } userErrors { message } } }"
  }'
*/