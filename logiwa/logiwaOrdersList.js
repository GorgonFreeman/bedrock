const { respond, mandateParam } = require('../utils');

const logiwaOrdersList = async (
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

const logiwaOrdersListApi = async (req, res) => {
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

  const result = await logiwaOrdersList(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaOrdersList,
  logiwaOrdersListApi,
};

// curl localhost:8000/logiwaOrdersList -H "Content-Type: application/json" -d '{ "arg": "1234" }'