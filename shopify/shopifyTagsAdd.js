// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsAdd

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyTagsAdd = async (
  credsPath,
  gid,
  tags,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

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