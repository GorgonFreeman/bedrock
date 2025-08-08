const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient, etsyGetShopIdAndUserId } = require('../etsy/etsy.utils');

const etsyReceiptGet = async (
  receiptId,
  {
    credsPath,
    shopId,
  } = {},
) => {

  if (!shopId) {
    const shopIdAndUserId = await etsyGetShopIdAndUserId(credsPath);
    shopId = shopIdAndUserId?.shopId;
  }

  if (!shopId) {
    return {
      success: false,
      error: ['Shop ID not found'],
    };
  }
  
  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/receipts/${ receiptId }`,
    context: {
      credsPath,
      withBearer: true,
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

// curl localhost:8000/etsyReceiptGet -H "Content-Type: application/json" -d '{ "receiptId": "3759771968" }' 