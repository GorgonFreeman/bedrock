const { respond, mandateParam } = require('../utils');

const bleckmannSkuGet = async (
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

const bleckmannSkuGetApi = async (req, res) => {
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

  const result = await bleckmannSkuGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannSkuGet,
  bleckmannSkuGetApi,
};

// curl localhost:8000/bleckmannSkuGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'