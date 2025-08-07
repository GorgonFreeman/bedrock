const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyReceiptGet = async (
  receiptId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/receipts/${ receiptId }`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyReceiptGetApi = async (req, res) => {
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

  const result = await etsyReceiptGet(
    receiptId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyReceiptGet,
  etsyReceiptGetApi,
};

// curl localhost:8000/etsyReceiptGet -H "Content-Type: application/json" -d '{ "receiptId": "123456" }' 