const { HOSTED } = require('../constants');
const { funcApi, logDeep, dateTimeFromNow } = require('../utils');
const { starshipitRequestVerifiers } = require('../starshipit/starshipit.utils');
const { starshipitOrderReferenceToShopifyStore, starshipitTrackingNumberToUrl } = require('../bedrock_unlisted/mappings');
const { bedrock_unlisted_slackErrorPost } = require('../bedrock_unlisted/bedrock_unlisted_slackErrorPost');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');

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
    !HOSTED && console.log('Missing required fields');
    return { success: false, error: ['Missing required fields'] };
  }

  if (trackingStatus !== 'Dispatched') {
    !HOSTED && console.log('Will fulfill on Dispatch');
    return { success: true, message: 'Will fulfill on Dispatch' };
  }

  if (!trackingNumber) {
    !HOSTED && console.log('tracking_number missing');
    return { success: false, error: ['tracking_number missing'] };
  }

  const shopifyStore = starshipitOrderReferenceToShopifyStore(orderReference, carrierName);
  const trackingUrl = carrierName && starshipitTrackingNumberToUrl(carrierName, trackingNumber);

  const response = await shopifyOrderFulfill(
    shopifyStore,
    { orderId: orderNumber },
    {
      notifyCustomer: true,
      originAddress: {
        countryCode: 'AU',
      },
      trackingInfo: {
        number: trackingNumber,
        ...carrierName && { company: carrierName },
        ...trackingUrl && { url: trackingUrl },
      },
    },
  );

  !HOSTED && logDeep(response);
  return response;
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