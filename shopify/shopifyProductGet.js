const { respond, mandateParam } = require('../utils');

const shopifyProductGet = async (
  credsPath,
  productId,
  // {
  //   option,
  // } = {},
) => {

  return { 
    credsPath, 
    productId,
  };
  
};

const shopifyProductGetApi = async (req, res) => {
  const { 
    credsPath,
    productId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'productId', productId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyProductGet(
    credsPath,
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyProductGet,
  shopifyProductGetApi,
};

// curl localhost:8000/shopifyProductGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "productId": "6979774283848" }'