const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyProductDelete = async (
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
    method: 'delete',
    verbose: true,
    credsPath,
  });

  logDeep(response);
  return response;
  
};

const printifyProductDeleteApi = async (req, res) => {
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

  const result = await printifyProductDelete(
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyProductDelete,
  printifyProductDeleteApi,
};

// curl localhost:8000/printifyProductDelete -H "Content-Type: application/json" -d '{ "productId": "1234" }'