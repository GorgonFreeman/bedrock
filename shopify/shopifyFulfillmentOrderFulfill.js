// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyFulfillmentOrderFulfill = async (
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

const shopifyFulfillmentOrderFulfillApi = async (req, res) => {
  const {
    credsPath,
    pageInput,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'pageInput', pageInput),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyFulfillmentOrderFulfill(
    credsPath,
    pageInput,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyFulfillmentOrderFulfill,
  shopifyFulfillmentOrderFulfillApi,
};

// curl http://localhost:8000/shopifyFulfillmentOrderFulfill -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'