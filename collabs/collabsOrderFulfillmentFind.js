const {
  REGIONS_LOGIWA,
  REGIONS_STARSHIPIT,
  REGIONS_BLECKMANN,
} = require('../constants');

const { funcApi, logDeep, askQuestion } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');
const { bleckmannPickticketGet } = require('../bleckmann/bleckmannPickticketGet');

const collabsOrderFulfillmentFind = async (
  region,
  orderId,
  {
    option,
  } = {},
) => {

  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const starshipitRelevant = REGIONS_STARSHIPIT.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [logiwaRelevant, starshipitRelevant, bleckmannRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  const shopifyOrderResponse = await shopifyOrderGet(region, { orderId }, {
    attrs: 'id name fulfillable shippingLine { title }',
  });

  if (!shopifyOrderResponse.success) {
    return shopifyOrderResponse;
  }

  const { 
    name: orderName,
    fulfillable,
    shippingLine,
  } = shopifyOrderResponse.result;
  const shippingMethod = shippingLine?.title;

  // if (!fulfillable) {
  //   return {
  //     success: false,
  //     message: 'Order is not fulfillable',
  //   };
  // }

  if (logiwaRelevant) {
    const logiwaOrderResponse = await logiwaOrderGet({ orderCode: orderName });
    const { success, result: logiwaOrder } = logiwaOrderResponse;
    if (!success) {
      return logiwaOrderResponse;
    }

    const {
      currentTrackingNumber,
      trackingNumbers,
      products,
      shipmentOrderStatusName,
      shipmentOrderStatusId,
    } = logiwaOrder;

    let trackingNumber = currentTrackingNumber;
    if (!trackingNumber && trackingNumbers?.length === 1) {
      trackingNumber = trackingNumbers[0];
    }
    
    // TODO: Handle partial shipments
    const allShipped = products.every(product => product.shippedUOMQuantity === product.quantity);

    const knownGoodStatuses = [
      'Shipped',
    ];

    if (!knownGoodStatuses.includes(shipmentOrderStatusName)) {
      return {
        success: false,
        error: [`Order is not shipped: ${ shipmentOrderStatusName }`],
      };
    }

    if (!trackingNumber) {
      return {
        success: false,
        error: ['No tracking number found'],
      };
    }

    if (!allShipped) {
      return {
        success: false,
        error: [`Order is not fully shipped`],
      };
    }

    const fulfillPayload = {
      originAddress: {
        // Logiwa, therefore US
        countryCode: 'US',
      },
      trackingInfo: {
        number: trackingNumber,
      },
    };
    
    // TODO: Consider notifying customer
    return await shopifyOrderFulfill(region, { orderId }, fulfillPayload);
  }

  if (starshipitRelevant) {
    if (!shippingMethod) {
      return {
        success: false,
        error: ['No shipping method'],
      };
    }

    const starshipitAccount = shopifyRegionToStarshipitAccount(region, shippingMethod);
    const starshipitOrderResponse = await starshipitOrderGet({ orderId, account: starshipitAccount });
    const { success, result: starshipitOrder } = starshipitOrderResponse;
    if (!success) {
      return starshipitOrderResponse;
    }

    if (!starshipitOrder) {
      return {
        success: false,
        error: ['No order found in Starshipit'],
      };
    }

    const { 
      status,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
    } = starshipitOrder || {};
    
    // TODO: Consider using 'manifested'
    if (
      starshipitOrder 
      && status
    ) {

      if (['Unshipped', 'Printed', 'Saved'].includes(status)) {
        return {
          success: false,
          error: [`Order is not shipped: ${ status }`],
        };
      }

      // console.log(3, starshipitOrder);
      // await askQuestion('?');

      const fulfillPayload = {
        originAddress: {
          // Starshipit, therefore AU
          countryCode: 'AU',
        },
        trackingInfo: {
          number: trackingNumber,
          url: trackingUrl,
        },
      };

      // TODO: Consider notifying customer
      return await shopifyOrderFulfill(region, { orderId }, fulfillPayload);
    }
  }

  if (bleckmannRelevant) {
    const bleckmannOrderResponse = await bleckmannPickticketGet({ pickticketReference: orderId });
    const { success, result: bleckmannOrder } = bleckmannOrderResponse;
    if (!success) {
      return bleckmannOrderResponse;
    }

    if (!bleckmannOrder) {
      return {
        success: false,
        error: ['No order found in Bleckmann'],
      };
    }

    logDeep(bleckmannOrder);
    await askQuestion('?');
  }
  
  const response = {
    success: false,
    error: ['Unable to fulfill order'],
  };
  logDeep(response);
  return response;
};

const collabsOrderFulfillmentFindApi = funcApi(collabsOrderFulfillmentFind, {
  argNames: ['region', 'orderId', 'options'],
  validatorsByArg: {
    region: Boolean,
    orderId: Boolean,
  },
});

module.exports = {
  collabsOrderFulfillmentFind,
  collabsOrderFulfillmentFindApi,
};

// curl localhost:8000/collabsOrderFulfillmentFind -H "Content-Type: application/json" -d '{ "region": "uk", "orderId": "12093091774837" }'