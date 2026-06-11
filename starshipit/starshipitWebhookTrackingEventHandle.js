const { funcApi, logDeep } = require('../utils');

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
});

module.exports = {
  starshipitWebhookTrackingEventHandle,
  starshipitWebhookTrackingEventHandleApi,
};