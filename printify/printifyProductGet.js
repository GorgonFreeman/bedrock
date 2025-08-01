const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyProductGet = async (
  productId,
  {
    credsPath,
    shopId,
  } = {},
) => {

  if (!shopId) {
    const { SHOP_ID } = credsByPath(['printify', credsPath]);
    shopId = SHOP_ID;
  }

  if (!shopId) {
    return {
      success: false,
      error: ['shopId is required'],
    };
  }

  const response = await printifyClient.fetch({
    url: `/shops/${ shopId }/products/${ productId }.json`, 
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
  
};

const printifyProductGetApi = async (req, res) => {
  const { 
    productId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'productId', productId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyProductGet(
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyProductGet,
  printifyProductGetApi,
};

// curl localhost:8000/printifyProductGet -H "Content-Type: application/json" -d '{ "productId": "67a3f38542eab3720306975b" }'