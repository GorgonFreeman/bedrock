const { respond, mandateParam, logDeep, Operation, OperationQueue, arrayStandardResponse } = require('../utils');
const { printifyOrderCreate } = require('../printify/printifyOrderCreate');

const printifyOrdersCreate = async (
  orderPayloads,
  {
    credsPath,
  } = {},
) => {

  const responses = await new OperationQueue(
    orderPayloads.map(orderPayload => {
      const { 
        externalId,
        shippingMethod,
        addressTo,
        lineItems,
        ...options
      } = orderPayload;

      return new Operation(
        printifyOrderCreate, 
        {
          args: [externalId, shippingMethod, addressTo, lineItems],
          options: { 
            ...options, 
            credsPath, 
          },
        },
      );
    }),
  ).run();

  const response = arrayStandardResponse(responses);

  logDeep(response);
  return response;
};

const printifyOrdersCreateApi = async (req, res) => {
  const { 
    orderPayloads,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'orderPayloads', orderPayloads, p => Array.isArray(p)),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyOrdersCreate(
    orderPayloads,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrdersCreate,
  printifyOrdersCreateApi,
};

// curl localhost:8000/printifyOrdersCreate -H "Content-Type: application/json" -d '{ "orderPayloads": [ { "externalId": "1234", ... } ] }'