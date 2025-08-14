// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsAdd

const { respond, mandateParam, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyTagsAddSingle = async (
  credsPath,
  gid,
  tags,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  if (!gid) {
    return {
      success: false,
      message: 'No gid provided',
    };
  }

  const response = await shopifyMutationDo(
    credsPath,
    'tagsAdd',
    {
      id: {
        type: 'ID!',
        value: gid,
      },
      tags: {
        type: '[String!]!',
        value: tags,
      },
    },
    `node { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyTagsAdd = async (
  credsPath,
  gid,
  tags,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const response = await actionMultipleOrSingle(
    gid,
    shopifyTagsAddSingle,
    (gid) => ({
      args: [credsPath, gid, tags],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyTagsAddApi = async (req, res) => {
  const {
    credsPath,
    gid,
    tags,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'gid', gid),
    mandateParam(res, 'tags', tags),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyTagsAdd(
    credsPath,
    gid,
    tags,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyTagsAdd,
  shopifyTagsAddApi,
};

// curl http://localhost:8000/shopifyTagsAdd -H 'Content-Type: application/json' -d '{ "credsPath": "au", "gid": "gid://shopify/Product/6981195825224", "tags": ["watermelon", "banana"] }'
// curl http://localhost:8000/shopifyTagsAdd -H 'Content-Type: application/json' -d '{ "credsPath": "au", "gid": ["gid://shopify/Product/6981195825224", "gid://shopify/Product/6981195825225"], "tags": ["watermelon", "banana"] }'