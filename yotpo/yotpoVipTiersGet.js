const { respond, mandateParam } = require('../utils');

const yotpoVipTiersGet = async (
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

const yotpoVipTiersGetApi = async (req, res) => {
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

  const result = await yotpoVipTiersGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoVipTiersGet,
  yotpoVipTiersGetApi,
};

// curl localhost:8000/yotpoVipTiersGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'