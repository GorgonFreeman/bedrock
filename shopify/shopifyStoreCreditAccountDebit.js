// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyStoreCreditAccountDebit = async (
  credsPath,
  input,
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
    page: input,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    context: {
      credsPath,
      apiVersion,
    },
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

const shopifyStoreCreditAccountDebitApi = async (req, res) => {
  const {
    credsPath,
    input,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'input', input),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyStoreCreditAccountDebit(
    credsPath,
    input,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyStoreCreditAccountDebit,
  shopifyStoreCreditAccountDebitApi,
};

// curl http://localhost:8000/shopifyStoreCreditAccountDebit -H 'Content-Type: application/json' -d '{ "credsPath": "au", "input": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'