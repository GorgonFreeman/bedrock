const { respond, mandateParam } = require('../utils');

const pipe17ReceiptGet = async (
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

const pipe17ReceiptGetApi = async (req, res) => {
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

  const result = await pipe17ReceiptGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ReceiptGet,
  pipe17ReceiptGetApi,
};

// curl localhost:8000/pipe17ReceiptGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'