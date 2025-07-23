const { respond, mandateParam, logDeep, Operation, OperationQueue, arrayStandardResponse } = require('../utils');
const { printifyOrderSubmit } = require('../printify/printifyOrderSubmit');

const printifyOrdersSubmit = async (
  orderIds,
  {
    ...options
  } = {},
) => {

  const responses = await new OperationQueue(
    orderIds.map(orderId => {
      return new Operation(
        printifyOrderSubmit,
        {
          args: [orderId],
          options: { ...options },
        },
      );
    }),
  ).run();

  const response = arrayStandardResponse(responses);
  logDeep(response);
  return response;
};

const printifyOrdersSubmitApi = async (req, res) => {
  const {
    orderIds,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'orderIds', orderIds, p => Array.isArray(p)),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyOrdersSubmit(
    orderIds,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrdersSubmit,
  printifyOrdersSubmitApi,
};

// curl localhost:8000/printifyOrdersSubmit -H "Content-Type: application/json" -d '{ "orderIds": ["1234", "5678"] }'