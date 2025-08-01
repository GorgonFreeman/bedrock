const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');
const { pipe17ArrivalGet } = require('../pipe17/pipe17ArrivalGet');

const pipe17ArrivalUpdate = async (
  arrivalIdentifier,
  updatePayload,
  {
    credsPath,
  } = {},
) => {

  let { arrivalId } = arrivalIdentifier;

  if (!arrivalId) {
    const arrivalResponse = await pipe17ArrivalGet(arrivalIdentifier, { credsPath });

    if (!arrivalResponse?.success) {
      return arrivalResponse;
    }

    arrivalId = arrivalResponse?.result?.arrivalId;
  }

  if (!arrivalId) {
    return {
      success: false,
      error: 'Arrival ID not found',
    };
  }

  const response = await pipe17Client.fetch({
    url: `/arrivals/${ arrivalId }`,
    method: 'put',
    body: updatePayload,
    context: {
      credsPath,
    },
    // interpreter: (response) => {
    //   return {
    //     ...response,
    //     ...response.result ? {
    //       result: response.result.receipt,
    //     } : {},
    //   };
    // },
  });
  
  logDeep(response);
  return response;
};

const pipe17ArrivalUpdateApi = async (req, res) => {
  const { 
    arrivalIdentifier,
    updatePayload,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'arrivalIdentifier', arrivalIdentifier, p => objHasAny(p, ['arrivalId', 'extArrivalId', 'extArrivalApiId', 'extReferenceId'])),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17ArrivalUpdate(
    arrivalIdentifier,
    updatePayload,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ArrivalUpdate,
  pipe17ArrivalUpdateApi,
};

// curl localhost:8000/pipe17ArrivalUpdate -H "Content-Type: application/json" -d '{ "arrivalIdentifier": { "arrivalId": "d22afa93793be1f1" }, "updatePayload": { "senderName": "john c:" } }'
// curl localhost:8000/pipe17ArrivalUpdate -H "Content-Type: application/json" -d '{ "arrivalIdentifier": { "extArrivalId": "US-WF-044-B" }, "updatePayload": { "senderName": "john c:" } }'