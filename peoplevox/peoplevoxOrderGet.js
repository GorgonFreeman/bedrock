const { respond, mandateParam } = require('../utils');

const peoplevoxOrderGet = async (
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

const peoplevoxOrderGetApi = async (req, res) => {
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

  const result = await peoplevoxOrderGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxOrderGet,
  peoplevoxOrderGetApi,
};

// curl localhost:8000/peoplevoxOrderGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'