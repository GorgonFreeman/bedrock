const { respond, mandateParam, logDeep } = require('../utils');
const { peoplevoxGetSingle } = require('../peoplevox/peoplevox.utils');

const peoplevoxOrderGet = async (
  salesOrderNumber,
  {
    credsPath,
  } = {},
) => {

  const response = await peoplevoxGetSingle(
    'Sales orders', 
    { idName: 'salesOrderNumber', id: salesOrderNumber }, 
    { credsPath },
  );
  logDeep(response);
  return response;
};

const peoplevoxOrderGetApi = async (req, res) => {
  const { 
    salesOrderNumber,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'salesOrderNumber', salesOrderNumber),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await peoplevoxOrderGet(
    salesOrderNumber,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxOrderGet,
  peoplevoxOrderGetApi,
};

// curl localhost:8000/peoplevoxOrderGet -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'