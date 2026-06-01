// https://shopify.dev/docs/api/admin-graphql/latest/mutations/orderClose

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `name id createdAt customer { email } cancelledAt`;

const shopifyOrderCloseSingle = async (
  credsPath,
  orderId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'orderClose',
    {
      input: {
        type: 'OrderCloseInput!',
        value: {
          id: `gid://shopify/Order/${ orderId }`,
        },
      },
    },
    `order { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );

  return response;
};

const shopifyOrderClose = async (
  credsPath,
  orderId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    queueRunOptions,
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    orderId,
    shopifyOrderCloseSingle,
    (orderId) => ({
      args: [credsPath, orderId],
      options: { apiVersion, returnAttrs },
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  // logDeep(response);
  return response;
};

const shopifyOrderCloseApi = funcApi(shopifyOrderClose, {
  argNames: ['credsPath', 'orderId', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    orderId: (p) => {
      if (Array.isArray(p)) {
        return p.length > 0 && p.every(Boolean);
      }
      return Boolean(p);
    },
  },
});

module.exports = {
  shopifyOrderClose,
  shopifyOrderCloseApi,
};

// curl http://localhost:8000/shopifyOrderClose -H 'Content-Type: application/json' -d '{ "credsPath": "au", "orderId": "1234567890" }'