const {
  REGIONS_LOGIWA,
} = require('../constants');

const { funcApi, logDeep } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

const collabsOrderFulfillmentFind = async (
  region,
  orderId,
  {
    option,
  } = {},
) => {

  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const anyRelevant = [logiwaRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  const shopifyOrderResponse = await shopifyOrderGet(region, { orderId }, {
    attrs: 'id name fulfillable',
  });

  if (!shopifyOrderResponse.success) {
    return shopifyOrderResponse;
  }

  const { 
    name: orderName,
    fulfillable,
  } = shopifyOrderResponse.result;

  if (!fulfillable) {
    return {
      success: false,
      message: 'Order is not fulfillable',
    };
  }

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

// curl localhost:8000/collabsOrderFulfillmentFind -H "Content-Type: application/json" -d '{ "region": "us", "orderId": "5979642789948" }'