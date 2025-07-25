// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyPageCreate = async (
  credsPath,
  pageInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const mutationName = 'pageCreate';
  
  const mutation = `
    mutation ${ mutationName }($page: PageCreateInput!) {
      ${ mutationName }(page: $page) {
        page {
          ${ returnAttrs }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    page: pageInput,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    factoryArgs: [credsPath, { apiVersion }],
    interpreter: async (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result[mutationName],
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyPageCreateApi = async (req, res) => {
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

  const result = await shopifyPageCreate(
    credsPath,
    pageInput,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyPageCreate,
  shopifyPageCreateApi,
};

// curl http://localhost:8000/shopifyPageCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "bodyHtml": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'