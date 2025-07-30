const { respond, mandateParam } = require('../utils');

const peoplevoxOrderGet = async (
  salesOrderNumber,
  {
    credsPath,
  } = {},
) => {

  return { 
    salesOrderNumber, 
    credsPath,
  };
  
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