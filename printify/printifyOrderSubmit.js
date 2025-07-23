const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyOrderSubmit = async (
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
    url: `/shops/${ shopId }/orders/${ orderId }/send_to_production.json`, 
    method: 'post',
    verbose: true,
    credsPath,
  });

  logDeep(response);
  return response;
  
};

const printifyOrderSubmitApi = async (req, res) => {
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

  const result = await printifyOrderSubmit(
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrderSubmit,
  printifyOrderSubmitApi,
};

// curl localhost:8000/printifyOrderSubmit -H "Content-Type: application/json" -d '{ "orderId": "1234" }'