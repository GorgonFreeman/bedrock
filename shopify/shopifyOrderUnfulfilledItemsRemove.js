// https://shopify.dev/docs/api/admin-graphql/latest/mutations/ordereditsetquantity

const { funcApi, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const LINE_ITEMS_FETCH_LIMIT = 250;

const defaultAttrs = `id name displayFulfillmentStatus`;

const orderLineItemsAttrs = `
  id
  quantity
  editableQuantity
  sku
  title
`;

const orderAttrs = `
  id
  lineItems(first: ${ LINE_ITEMS_FETCH_LIMIT }) {
    edges {
      node {
        id
        unfulfilledQuantity
      }
    }
  }
`;

const shopifyOrderUnfulfilledItemsRemoveSingle = async (
  credsPath,
  orderIdentifier,
  {
    apiVersion,
    notifyCustomer = false,
    restock = false,
    staffNote,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const orderResponse = await shopifyOrderGet(
    credsPath,
    orderIdentifier,
    {
      apiVersion,
      attrs: orderAttrs,
    },
  );

  const { success: orderSuccess, result: order } = orderResponse;

  if (!orderSuccess) {
    return orderResponse;
  }

  const { lineItems } = order;

  if (lineItems.length >= LINE_ITEMS_FETCH_LIMIT) {
    return {
      success: false,
      error: [`Order could have more than ${ LINE_ITEMS_FETCH_LIMIT } line items. Please check manually.`],
    };
  }

  const unfulfilledLineItems = lineItems.filter(li => li.unfulfilledQuantity > 0);

  if (!unfulfilledLineItems.length) {
    return {
      success: true,
      result: { message: 'No unfulfilled line items to remove' },
      code: 204,
    };
  }

  const beginResponse = await shopifyMutationDo(
    credsPath,
    'orderEditBegin',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/Order/${ orderId }`,
      },
    },
    `calculatedOrder {
      id
      lineItems(first: ${ LINE_ITEMS_FETCH_LIMIT }) {
        edges {
          node {
            ${ orderLineItemsAttrs }
          }
        }
      }
    }`,
    {
      apiVersion,
    },
  );

  const { success: beginSuccess, result: beginResult } = beginResponse;

  if (!beginSuccess) {
    return beginResponse;
  }

  const { calculatedOrder } = beginResult;
  const { id: calculatedOrderGid, lineItems: calculatedLineItems } = calculatedOrder;

  const editableLineItems = calculatedLineItems.filter(li => li.editableQuantity > 0);

  if (!editableLineItems.length) {
    return {
      success: true,
      result: { message: 'No unfulfilled line items to remove' },
      code: 204,
    };
  }

  for (const lineItem of editableLineItems) {
    const { id: lineItemGid, quantity, editableQuantity } = lineItem;
    const newQuantity = quantity - editableQuantity;

    const setQuantityResponse = await shopifyMutationDo(
      credsPath,
      'orderEditSetQuantity',
      {
        id: {
          type: 'ID!',
          value: calculatedOrderGid,
        },
        lineItemId: {
          type: 'ID!',
          value: lineItemGid,
        },
        quantity: {
          type: 'Int!',
          value: newQuantity,
        },
        ...restock && {
          restock: {
            type: 'Boolean',
            value: restock,
          },
        },
      },
      'calculatedOrder { id }',
      {
        apiVersion,
      },
    );

    const { success: setQuantitySuccess } = setQuantityResponse;

    if (!setQuantitySuccess) {
      return setQuantityResponse;
    }
  }

  const commitResponse = await shopifyMutationDo(
    credsPath,
    'orderEditCommit',
    {
      id: {
        type: 'ID!',
        value: calculatedOrderGid,
      },
      notifyCustomer: {
        type: 'Boolean',
        value: notifyCustomer,
      },
      ...staffNote && {
        staffNote: {
          type: 'String',
          value: staffNote,
        },
      },
    },
    `order { ${ returnAttrs } } successMessages`,
    {
      apiVersion,
    },
  );

  return commitResponse;
};

const shopifyOrderUnfulfilledItemsRemove = async (
  credsPath,
  orderIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    orderIdentifier,
    shopifyOrderUnfulfilledItemsRemoveSingle,
    (orderIdentifier) => ({
      args: [credsPath, orderIdentifier],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );

  return response;
};

const shopifyOrderUnfulfilledItemsRemoveApi = funcApi(shopifyOrderUnfulfilledItemsRemove, {
  argNames: ['credsPath', 'orderIdentifier', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    orderIdentifier: Boolean,
  },
});

module.exports = {
  shopifyOrderUnfulfilledItemsRemove,
  shopifyOrderUnfulfilledItemsRemoveApi,
};

// curl localhost:8000/shopifyOrderUnfulfilledItemsRemove -H "Content-Type: application/json" -d '{ "credsPath": "au", "arg": "6979774283848" }'
