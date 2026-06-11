const { funcApi, logDeep } = require('../utils');
const { starshipitRequestVerifiers } = require('../starshipit/starshipit.utils');

const starshipitWebhookTrackingEventHandle = async (req) => {

  logDeep({
    headers: req.headers,
    body: req.body,
  });

  return { 
    success: true,
  };
};

const starshipitWebhookTrackingEventHandleApi = funcApi(starshipitWebhookTrackingEventHandle, {
  passThroughReq: true,
  requestVerifiers: [
    starshipitRequestVerifiers.verifyStarshipitWebhookRequest,
  ],
});

module.exports = {
  starshipitWebhookTrackingEventHandle,
  starshipitWebhookTrackingEventHandleApi,
};

// Set starshipit.WEBHOOK_SECRET in CREDS to match the secret in Starshipit webhook settings.

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
    order_reference: 'REF123456',
    carrier_name: 'DHL Express',
    carrier_service: 'P1',
    shipment_date: '2026-06-10T12:03:42.1543701Z',
    tracking_number: 'T01234567890',
    tracking_status: 'InTransit',
    last_updated_date: '2026-06-11T04:43:42.1543701Z'
  }
}
*/