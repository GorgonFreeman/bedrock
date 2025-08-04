const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17OrderGet = async (
  receiptId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17Client.fetch({
    url: `/receipts/${ receiptId }`,
    context: {
      credsPath,
    },
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

const pipe17OrderGetApi = async (req, res) => {
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

  const result = await pipe17OrderGet(
    receiptId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17OrderGet,
  pipe17OrderGetApi,
};

// curl localhost:8000/pipe17OrderGet -H "Content-Type: application/json" -d '{ "receiptId": "b9d03991a844e340" }'