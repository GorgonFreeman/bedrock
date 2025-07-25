// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageDelete

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyPageDelete = async (
  credsPath,
  pageId,
  {
    apiVersion,
  } = {},
) => {
  
  const mutationName = 'pageDelete';

  const mutation = `
    mutation ${ mutationName }($id: ID!) {
      ${ mutationName }(id: $id) {
        deletedPageId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/Page/${ pageId }`,
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

const shopifyPageDeleteApi = async (req, res) => {
  const {
    credsPath,
    pageId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'pageId', pageId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyPageDelete(
    credsPath,
    pageId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyPageDelete,
  shopifyPageDeleteApi,
};

// curl http://localhost:8000/shopifyPageDelete -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageId": "91912568904" }'