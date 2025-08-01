// https://api-docs.starshipit.com/#05a846b9-0128-4dd3-80e4-e6008aef9b94

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitTrackingGet = async (
  credsPath,
  {
    trackingNumber,
    orderNumber,
  },
) => {

  const response = await starshipitClient.fetch({
    url: '/track',
    params: {
      ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
      ...(orderNumber ? { order_number: orderNumber } : {}),
    },
    context: {
      credsPath,
    },
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.results,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const starshipitTrackingGetApi = async (req, res) => {
  const { 
    credsPath,
    trackingIdentifier,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'trackingIdentifier', trackingIdentifier, p => objHasAny(p, ['trackingNumber', 'orderNumber'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitTrackingGet(
    credsPath,
    trackingIdentifier,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitTrackingGet,
  starshipitTrackingGetApi,
};

// curl localhost:8000/starshipitTrackingGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "trackingIdentifier": { "orderNumber": "7027430785096" } }' 
// curl localhost:8000/starshipitTrackingGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "trackingIdentifier": { "trackingNumber": "SL3916359701000961508" } }' 