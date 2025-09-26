// https://shopify.dev/docs/api/admin-graphql/latest/queries/order

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `
  id
  discount {
    ... on DiscountCodeBasic {
      title
      appliesOncePerCustomer
      asyncUsageCount
      createdAt
      startsAt
      endsAt
      hasTimelineComment
      shortSummary
      status
      summary
      usageLimit
      codesCount {
        count
      }
    }
    ... on DiscountCodeBxgy {
      title
    }
    ... on DiscountCodeFreeShipping {
      title
    }
    ... on DiscountAutomaticApp {
      title
    }
    ... on DiscountAutomaticBasic {
      title
    }
    ... on DiscountAutomaticBxgy {
      title
    }
  }
`;

const shopifyDiscountGet = async (
  credsPath,
  {
    discountId,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'discountNode',
    discountId,
    {
      apiVersion,
      attrs,
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyDiscountGetApi = funcApi(shopifyDiscountGet, {
  argNames: ['credsPath', 'discountIdentifier', 'options'],
});

module.exports = {
  shopifyDiscountGet,
  shopifyDiscountGetApi,
};

// curl localhost:8000/shopifyDiscountGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "discountIdentifier": { "discountId": "1696440287304" } }'