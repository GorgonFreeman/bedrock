const { respond, mandateParam } = require('../utils');

const iwishCustomerWishlistGet = async (
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

const iwishCustomerWishlistGetApi = async (req, res) => {
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

  const result = await iwishCustomerWishlistGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  iwishCustomerWishlistGet,
  iwishCustomerWishlistGetApi,
};

// curl localhost:8000/iwishCustomerWishlistGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'