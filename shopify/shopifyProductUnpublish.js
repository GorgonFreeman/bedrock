// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyProductUnpublish = async (
  credsPath,
  pageInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

};

const shopifyProductUnpublishApi = funcApi(shopifyProductUnpublish, {
  argNames: ['credsPath', 'pageInput', 'options'],
});

module.exports = {
  shopifyProductUnpublish,
  shopifyProductUnpublishApi,
};

// curl http://localhost:8000/shopifyProductUnpublish -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'