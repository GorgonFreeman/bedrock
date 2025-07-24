const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17ReceiptGet = async (
  receiptId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'receipt',
    receiptId,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17ReceiptGetApi = async (req, res) => {
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

  const result = await pipe17ReceiptGet(
    receiptId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ReceiptGet,
  pipe17ReceiptGetApi,
};

// curl localhost:8000/pipe17ReceiptGet -H "Content-Type: application/json" -d '{ "receiptId": "b9d03991a844e340" }'