// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyFulfillmentTrackingInfoUpdate = async (
  credsPath,
  pageInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'pageCreate',
    {
      page: {
        type: 'PageCreateInput!',
        value: pageInput,
      },
    },
    `page { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyFulfillmentTrackingInfoUpdateApi = funcApi(shopifyFulfillmentTrackingInfoUpdate, {
  argNames: ['credsPath', 'pageInput', 'options'],
});

module.exports = {
  shopifyFulfillmentTrackingInfoUpdate,
  shopifyFulfillmentTrackingInfoUpdateApi,
};

// curl http://localhost:8000/shopifyFulfillmentTrackingInfoUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'