const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17ArrivalUpdate = async (
  extArrivalId,
  updatePayload,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17Client.fetch({
    url: `/arrivals/ext:${ extArrivalId }`,
    method: 'put',
    body: updatePayload,
    factoryArgs: [credsPath],
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
    extArrivalId,
    updatePayload,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'extArrivalId', extArrivalId),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17ArrivalUpdate(
    extArrivalId,
    updatePayload,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ArrivalUpdate,
  pipe17ArrivalUpdateApi,
};

// curl localhost:8000/pipe17ArrivalUpdate -H "Content-Type: application/json" -d '{ "extArrivalId": "b9d03991a844e340", "updatePayload": { "senderName": "john c:" } }'