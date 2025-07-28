const { respond, mandateParam } = require('../utils');

const starshipitOrderGet = async (
  credsPath,
  orderId,
) => {

  return { 
    credsPath,
    orderId,
  };
  
};

const starshipitOrderGetApi = async (req, res) => {
  const { 
    credsPath,
    orderId,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitOrderGet(
    credsPath,
    orderId,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrderGet,
  starshipitOrderGetApi,
};

// curl localhost:8000/starshipitOrderGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderId": 5989356896328 }'