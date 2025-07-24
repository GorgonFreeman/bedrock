const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17PurchaseGet = async (
  purchaseId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'purchase',
    purchaseId,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17PurchaseGetApi = async (req, res) => {
  const { 
    purchaseId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'purchaseId', purchaseId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17PurchaseGet(
    purchaseId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17PurchaseGet,
  pipe17PurchaseGetApi,
};

// curl localhost:8000/pipe17PurchaseGet -H "Content-Type: application/json" -d '{ "purchaseId": "a906b740adf5f69a" }'