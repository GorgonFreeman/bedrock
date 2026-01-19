// A fulfillment sweep based on fulfillment orders, explicitly fulfilling payloads of line items wherever possible.

const { HOSTED } = require('../constants');
const { funcApi, logDeep, surveyNestedArrays } = require('../utils');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

const collabsFulfillmentSweepV5 = async (
  store,
) => {

  piles = {
    shopify: [],
  };

  const shopifyGetter = await shopifyOrdersGetter(
    store,
    {
      attrs: `
        id
        name
        shippingLine {
          title
        }
        fulfillmentOrders (first: 10) {
          edges {
            node {
              id
              status
              lineItems (first: 10) {
                edges {
                  node {
                    id
                    sku
                    remainingQuantity
                  }
                }
              }
            }
          }
        }
      `,
      queries: [
        'created_at:>2025-06-01',
        'fulfillment_status:unshipped',
        'status:open',
        'delivery_method:shipping',
      ],
      sortKey: 'CREATED_AT',
      reverse: true,

      onItems: (items) => {
        piles.shopify.push(...items);
      },
  
      logFlavourText: `${ store }:shopifyGetter:`,
    },
  );

  await Promise.all([
    shopifyGetter.run({ verbose: !HOSTED }),
  ]);

  logDeep(surveyNestedArrays(piles));

  return { 
    success: true,
    result: surveyNestedArrays(piles),
  };
  
};

const collabsFulfillmentSweepV5Api = funcApi(collabsFulfillmentSweepV5, {
  argNames: ['store'],
});

module.exports = {
  collabsFulfillmentSweepV5,
  collabsFulfillmentSweepV5Api,
};

// curl localhost:8000/collabsFulfillmentSweepV5 -H "Content-Type: application/json" -d '{ "store": "us" }'