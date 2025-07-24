const { respond, mandateParam } = require('../utils');

const pipe17PurchaseGet = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const pipe17PurchaseGetApi = async (req, res) => {
  const { 
    arg,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'arg', arg),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17PurchaseGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17PurchaseGet,
  pipe17PurchaseGetApi,
};

// curl localhost:8000/pipe17PurchaseGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'