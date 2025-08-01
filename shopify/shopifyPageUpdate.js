// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageUpdate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyPageUpdate = async (
  credsPath,
  pageId,
  updatePayload,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {
  
  const mutationName = 'pageUpdate';

  const mutation = `
    mutation ${ mutationName }($id: ID!, $page: PageUpdateInput!) {
      ${ mutationName }(id: $id, page: $page) {
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
    id: `gid://shopify/Page/${ pageId }`,
    page: updatePayload,
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

const shopifyPageUpdateApi = async (req, res) => {
  const {
    credsPath,
    pageId,
    updatePayload,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'pageId', pageId),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyPageUpdate(
    credsPath,
    pageId,
    updatePayload,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyPageUpdate,
  shopifyPageUpdateApi,
};

// curl http://localhost:8000/shopifyPageUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageId": "91912601672", "updatePayload": { "title": "Updated Page Title" } }'