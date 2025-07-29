const { respond, mandateParam } = require('../utils');

const peoplevoxAuthGet = async (
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

const peoplevoxAuthGetApi = async (req, res) => {
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

  const result = await peoplevoxAuthGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxAuthGet,
  peoplevoxAuthGetApi,
};

// curl localhost:8000/peoplevoxAuthGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'