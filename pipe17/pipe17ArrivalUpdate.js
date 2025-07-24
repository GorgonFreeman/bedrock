const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17ArrivalUpdate = async (
  receiptId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17Client.fetch({
    url: `/receipts/${ receiptId }`,
    factoryArgs: [credsPath],
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.receipt,
        } : {},
      };
    },
  });
  
  logDeep(response);
  return response;
};

const pipe17ArrivalUpdateApi = async (req, res) => {
  const { 
    receiptId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'receiptId', receiptId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17ArrivalUpdate(
    receiptId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ArrivalUpdate,
  pipe17ArrivalUpdateApi,
};

// curl localhost:8000/pipe17ArrivalUpdate -H "Content-Type: application/json" -d '{ "receiptId": "b9d03991a844e340" }'