const { HOSTED, REGIONS_STARSHIPIT } = require('../constants');
const { funcApi, logDeep, dateTimeFromNow, gidToId } = require('../utils');
const { starshipitRequestVerifiers } = require('../starshipit/starshipit.utils');
const { starshipitTrackingNumberToUrl } = require('../bedrock_unlisted/mappings');
const { bedrock_unlisted_slackErrorPost } = require('../bedrock_unlisted/bedrock_unlisted_slackErrorPost');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyMetafieldsSet } = require('../shopify/shopifyMetafieldsSet');
const { shopifyFulfillmentTrackingInfoUpdate } = require('../shopify/shopifyFulfillmentTrackingInfoUpdate');

const INITIAL_FULFILLMENT_METAFIELD = {
  namespace: 'fulfillment',
  key: 'initial',
};

const DISPATCHED_ORDER_ATTRS = `
  id
  displayFulfillmentStatus
  mfInitialFulfillment: metafield(namespace: "${ INITIAL_FULFILLMENT_METAFIELD.namespace }", key: "${ INITIAL_FULFILLMENT_METAFIELD.key }") {
    value
  }
`;

const { STARSHIPIT_CREDS_PATH } = process.env;

const starshipitWebhookTrackingEventHandle = async (req) => {

  !HOSTED && logDeep({
    headers: req.headers,
    body: req.body,
  });

  const {
    metadata = {},
    ...body
  } = req.body;

  const {
    order_number: orderNumber,
    order_reference: orderReference,
    carrier_name: carrierName,
    tracking_number: trackingNumber,
    tracking_status: trackingStatus,
  } = body;

  console.log(dateTimeFromNow(), orderReference);

  if (!orderNumber || !orderReference) {
    console.error('Missing required fields', body);
    return { success: false, error: ['Missing required fields'] };
  }

  let shopifyStore;

  for (const store of REGIONS_STARSHIPIT) {
    const orderResponse = await shopifyOrderGet(
      store,
      { orderId: orderNumber },
      { attrs: 'id' },
    );

    if (orderResponse.success && orderResponse.result?.id) {
      shopifyStore = store;
      break;
    }
  }

  if (!shopifyStore) {
    return { success: false, error: ['Order not found on any store'] };
  }

  const originAddress = {
    countryCode: 'AU',
  };

  const getTrackingInfo = () => {
    const trackingUrl = carrierName && starshipitTrackingNumberToUrl(carrierName, trackingNumber);

    return {
      number: trackingNumber,
      ...carrierName && { company: carrierName },
      ...trackingUrl && { url: trackingUrl },
    };
  };

  const storeInitialFulfillmentMetafield = async (fulfillmentId) => {
    return shopifyMetafieldsSet(shopifyStore, [{
      ownerId: `gid://shopify/Order/${ orderNumber }`,
      namespace: INITIAL_FULFILLMENT_METAFIELD.namespace,
      key: INITIAL_FULFILLMENT_METAFIELD.key,
      type: 'single_line_text_field',
      value: String(fulfillmentId),
    }]);
  };

  if (trackingStatus.toLowerCase() === 'printed') {
    const response = await shopifyOrderFulfill(
      shopifyStore,
      { orderId: orderNumber },
      { 
        notifyCustomer: false,
        originAddress,
      },
    );

    if (!response.success) {
      return response;
    }

    const fulfillmentId = gidToId(response.result?.fulfillment?.id);
    if (fulfillmentId) {
      const metafieldResponse = await storeInitialFulfillmentMetafield(fulfillmentId);
      if (!metafieldResponse.success) {
        return metafieldResponse;
      }
    }

    return response;
  }

  if (trackingStatus.toLowerCase() === 'dispatched') {
    const orderResponse = await shopifyOrderGet(
      shopifyStore,
      { orderId: orderNumber },
      { attrs: DISPATCHED_ORDER_ATTRS },
    );

    if (!orderResponse.success) {
      return orderResponse;
    }

    const {
      displayFulfillmentStatus,
      mfInitialFulfillment,
    } = orderResponse.result;

    const trackingInfo = getTrackingInfo();
    const initialFulfillmentId = mfInitialFulfillment?.value;

    if (initialFulfillmentId) {
      return shopifyFulfillmentTrackingInfoUpdate(
        shopifyStore,
        initialFulfillmentId,
        trackingInfo,
        { notifyCustomer: true },
      );
    }

    if (displayFulfillmentStatus !== 'FULFILLED') {
      return shopifyOrderFulfill(
        shopifyStore,
        { orderId: orderNumber },
        {
          notifyCustomer: true,
          originAddress,
          trackingInfo,
        },
      );
    }

    return {
      success: true,
      message: 'Order already fulfilled, no initial fulfillment metafield to update',
    };
  }

  console.warn(`Not syncing status ${ trackingStatus }`);
  return { success: true, message: `Not syncing status ${ trackingStatus }` };
};

const starshipitWebhookTrackingEventHandleApi = funcApi(starshipitWebhookTrackingEventHandle, {
  passThroughReq: true,
  requestVerifiers: [
    starshipitRequestVerifiers.verifyStarshipitWebhookRequest(STARSHIPIT_CREDS_PATH),
  ],
  errorReporter: bedrock_unlisted_slackErrorPost,
  errorReporterPayload: { options: { logFlavourText: 'starshipitWebhookTrackingEventHandle' } },
  errorFilters: [
    error => error !== 'No fulfillment orders found',
  ],
});

module.exports = {
  starshipitWebhookTrackingEventHandle,
  starshipitWebhookTrackingEventHandleApi,
};

// Set STARSHIPIT_CREDS_PATH env var and matching WEBHOOK_SECRET in CREDS for that account.

/* Event sample
{
  headers: {
    host: '1xxx1-11-111-111-111.ngrok-free.app',
    'content-length': '270',
    'content-type': 'application/json',
    'x-starshipit-signature': 'abc123...',
    expect: '100-continue',
    'x-forwarded-for': '11.11.11.11',
    'x-forwarded-host': '1xxx1-11-111-111-111.ngrok-free.app',
    'x-forwarded-proto': 'https',
    'accept-encoding': 'gzip'
  },
  body: {
    order_number: '12345678',
    order_reference: 'AUS123456',
    carrier_name: 'DHL Express',
    carrier_service: 'P1',
    shipment_date: '2026-06-10T12:03:42.1543701Z',
    tracking_number: 'T01234567890',
    tracking_status: 'InTransit',
    last_updated_date: '2026-06-11T04:43:42.1543701Z'
  }
}
*/
