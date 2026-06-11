const { funcApi, logDeep } = require('../utils');

const starshipitWebhookTrackingEventHandle = async (req) => {

  logDeep(req);

  return { 
    success: true,
  };
};

const starshipitWebhookTrackingEventHandleApi = funcApi(starshipitWebhookTrackingEventHandle, {
  passThroughReq: true,
});

module.exports = {
  starshipitWebhookTrackingEventHandle,
  starshipitWebhookTrackingEventHandleApi,
};