const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyOrderGet = async (
  orderId,
  {
    credsPath,
    shopId,
  } = {},
) => {

  if (!shopId) {
    const { SHOP_ID } = credsByPath(['printify', credsPath]);
    shopId = SHOP_ID;
  }

  if (!shopId) {
    return {
      success: false,
      error: ['shopId is required'],
    };
  }

  const response = await printifyClient.fetch({
    url: `/shops/${ shopId }/orders/${ orderId }.json`, 
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const printifyOrderGetApi = async (req, res) => {
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

  const result = await printifyOrderGet(
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrderGet,
  printifyOrderGetApi,
};

// curl localhost:8000/printifyOrderGet -H "Content-Type: application/json" -d '{ "orderId": "1234" }'