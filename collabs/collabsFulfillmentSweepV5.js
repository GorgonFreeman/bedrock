// A fulfillment sweep based on fulfillment orders, explicitly fulfilling payloads of line items wherever possible.

const { 
  HOSTED,
  REGIONS_LOGIWA,
} = require('../constants');
const { funcApi, logDeep, surveyNestedArrays, Processor, ThresholdActioner, askQuestion } = require('../utils');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

const collabsFulfillmentSweepV5 = async (
  store,
) => {

  piles = {
    shopify: [],
    missing: [],
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
        mf_externalFulfillmentIds: metafield(namespace: "shipping", key: "ext_fulfillment_ids") { 
          value
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

  const wmsGetters = [];
  const assessors = [];

  if (REGIONS_LOGIWA.includes(store)) {
    
    const logiwaThoroughAssessor = new Processor(
      piles.shopify,
      async (pile) => {
        const shopifyOrder = pile.shift();
        console.log(`${ store }:logiwaThoroughAssessor:`, piles.shopify.length);
        const { name: orderName } = shopifyOrder;

        const logiwaOrderResponse = await logiwaOrderGet({ orderCode: orderName });
        const { success: logiwaOrderSuccess, result: logiwaOrder } = logiwaOrderResponse;
        if (!logiwaOrderSuccess) {

          if (logiwaOrderResponse?.error?.every(error => error === 'Order not found')) {
            piles.missing.push(shopifyOrder);
            return;
          }

          logDeep({ 
            logiwaOrderResponse,
          });
          await askQuestion('?');
          // piles.errors.push(shopifyOrder);
          // return;
        }
        
        if (!logiwaOrder) {
          logDeep({ 
            logiwaOrderResponse,
          });
          await askQuestion('?');
          // piles.errors.push(shopifyOrder);
          // return;
        }

        logDeep({ 
          logiwaOrderResponse,
        });
        await askQuestion('?');

        // const {
        //   shipmentOrderStatusName,
        // } = logiwaOrder;

        // if (shipmentOrderStatusName !== 'Shipped') {
        //   return;
        // }
        
        // const {
        //   trackingNumbers,
        //   products,
        // } = logiwaOrder;
        
        // if (trackingNumbers?.length !== 1) {
        //   console.error(logiwaOrder);
        //   console.error(`Oh no, ${ trackingNumbers?.length } tracking numbers found for ${ logiwaOrder.code }`);
        //   return;
        // }

        // const trackingNumber = trackingNumbers[0];
    
        // const allShipped = products.every(product => product.shippedUOMQuantity === product.quantity);
    
        // if (!trackingNumber || !allShipped) {
        //   logDeep(`Logiwa something wrong`, { trackingNumber, allShipped }, logiwaOrder);
        //   return;
        // }
    
        // const fulfillPayload = {
        //   originAddress: {
        //     // Logiwa, therefore US
        //     countryCode: 'US',
        //   },
        //   trackingInfo: {
        //     number: trackingNumber,
        //   },
        // };
    
        // piles.shopifyOrderFulfill.push([
        //   store,
        //   { orderName: logiwaOrder.code },
        //   {
        //     notifyCustomer: true,
        //     ...fulfillPayload,
        //   },
        // ]);        
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `${ store }:logiwaThoroughAssessor:`,
        // runOptions: {
        //   interval: 20,
        // },
      },
    );

    shopifyGetter.on('done', () => {
      logiwaThoroughAssessor.canFinish = true;
    });

    assessors.push(logiwaThoroughAssessor);
  }

  await Promise.all([
    shopifyGetter.run({ verbose: !HOSTED }),
    ...wmsGetters.map(getter => getter.run({ verbose: !HOSTED })),
    ...assessors.map(assessor => assessor.run({ verbose: !HOSTED })),
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