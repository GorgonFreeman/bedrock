// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsRemove

const { respond, mandateParam, logDeep, OperationQueue, Operation, arrayStandardResponse } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyTagsRemoveSingle = async (
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
    'tagsRemove',
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

const shopifyTagsRemove = async (
  credsPath,
  gid,
  tags,
  {
    apiVersion,
    returnAttrs,
  } = {},
) => {

  // TODO: Make multiple-or-single handling a utility
  if (Array.isArray(gid)) {
    const queue = new OperationQueue(gid.map(gidItem => new Operation(
      shopifyTagsRemoveSingle, 
      {
        args: [credsPath, gidItem, tags], 
        options: { apiVersion, returnAttrs },
      },
    )));
    let queueResponses = await queue.run();
    queueResponse = arrayStandardResponse(queueResponses);
    return queueResponse;
  }

  return shopifyTagsRemoveSingle(credsPath, gid, tags, { apiVersion, returnAttrs });
};

const shopifyTagsRemoveApi = async (req, res) => {
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

  const result = await shopifyTagsRemove(
    credsPath,
    gid,
    tags,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyTagsRemove,
  shopifyTagsRemoveApi,
};

// curl http://localhost:8000/shopifyTagsRemove -H 'Content-Type: application/json' -d '{ "credsPath": "au", "gid": "gid://shopify/Product/6981195825224", "tags": ["watermelon", "banana"] }'
// curl http://localhost:8000/shopifyTagsRemove -H 'Content-Type: application/json' -d '{ "credsPath": "au", "gid": ["gid://shopify/Customer/8489669984328", "gid://shopify/Customer/8469261484104"], "tags": ["watermelon", "banana"] }'