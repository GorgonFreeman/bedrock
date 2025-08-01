const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyOrderCancel = async (
  orderId,
  {
    credsPath,
    shopId,
  } = {},
) => {

  if (!shopId) {
    const creds = credsByPath(['printify', credsPath]);
    const {
      SHOP_ID,
    } = creds;
    shopId = SHOP_ID;
  }

  if (!shopId) {
    return {
      success: false,
      error: ['shopId is required'],
    };
  }

  const response = await printifyClient.fetch({
    url: `/shops/${ shopId }/orders/${ orderId }/cancel.json`, 
    method: 'post',
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
  
};

const printifyOrderCancelApi = async (req, res) => {
  const { 
    orderId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyOrderCancel(
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrderCancel,
  printifyOrderCancelApi,
};

// curl localhost:8000/printifyOrderCancel -H "Content-Type: application/json" -d '{ "orderId": "67a9d86e097ec1497c0082b1" }'