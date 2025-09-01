const {
  REGIONS_LOGIWA,
  REGIONS_STARSHIPIT,
  REGIONS_BLECKMANN,
} = require('../constants');

const { funcApi, logDeep, askQuestion } = require('../utils');

const { shopifyFulfillmentLineItemsFromExternalLineItems } = require('../shopify/shopify.utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');
const { bleckmannPickticketGet } = require('../bleckmann/bleckmannPickticketGet');
const { bleckmannParcelsGet } = require('../bleckmann/bleckmannParcelsGet');

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

  const shopifyOrderAttrs = `
    id 
    name 
    fulfillable 
    shippingLine { 
      title 
    } 
    lineItems (first: 100) { 
      edges {
        node {
          id 
          sku
          unfulfilledQuantity 
          requiresShipping 
        }
      }
    }
  `;

  const shopifyOrderResponse = await shopifyOrderGet(region, { orderId }, { attrs: shopifyOrderAttrs });

  if (!shopifyOrderResponse.success) {
    return shopifyOrderResponse;
  }

  const { 
    name: orderName,
    fulfillable,
    shippingLine,
    lineItems,
  } = shopifyOrderResponse.result;
  const shippingMethod = shippingLine?.title;

  const shippableLineItems = lineItems?.filter(lineItem => !lineItem.requiresShipping);

  if (shippableLineItems.length >= 100) {
    return {
      success: false,
      error: ['Order could have >100 shippable line items, so this function is not equipped to handle it'],
    };
  }

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

    const { 
      status,
    } = bleckmannOrder;

    if (status !== 'SHIPPED') {
      logDeep(bleckmannOrder);
      await askQuestion('?');
    }

    const parcelsResponse = await bleckmannParcelsGet({ pickticketId: bleckmannOrder.pickticketId }, { includeDetails: true });
    const { success: parcelsSuccess, result: parcels } = parcelsResponse;
    if (!parcelsSuccess) {
      return parcelsResponse;
    }

    logDeep(parcels);
    await askQuestion('?');

    for (const parcel of parcels) {
      const {
        trackingNumber,
        trackingUrl,
        lines,
      } = parcel;
      
      if (!trackingNumber) {
        logDeep(parcel);
        throw new Error(`No tracking number on a Bleckmann parcel`);
      }

      const fulfillPayloadLineItems = shopifyFulfillmentLineItemsFromExternalLineItems(lines, shippableLineItems, { skuProp: 'skuId' });
      logDeep(fulfillPayloadLineItems);
      await askQuestion('?');
    }

    // const fulfillPayload = {
    //   originAddress: {
    //     // Bleckmann, therefore UK
    //     countryCode: 'UK',
    //   },
    //   trackingInfo: {
    //     number: parcels[0].trackingNumber,
    //   },
    // };

    // return await shopifyOrderFulfill(region, { orderId }, fulfillPayload);
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

// curl localhost:8000/collabsOrderFulfillmentFind -H "Content-Type: application/json" -d '{ "region": "uk", "orderId": "12145428431221" }'