// https://shopify.dev/docs/api/admin-graphql/latest/mutations/orderClose

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `cancelledAt`;

const shopifyOrderClose = async (
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
  logDeep(response);
  return response;
};

const shopifyOrderCloseApi = funcApi(shopifyOrderClose, {
  argNames: ['credsPath', 'orderId', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    orderId: Boolean,
  },
});

module.exports = {
  shopifyOrderClose,
  shopifyOrderCloseApi,
};

// curl http://localhost:8000/shopifyOrderClose -H 'Content-Type: application/json' -d '{ "credsPath": "au", "orderId": "1234567890" }'