const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyProductUpdate = async (
  productId,
  updatePayload,
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
    method: 'put',
    body: updatePayload,
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
  
};

const printifyProductUpdateApi = async (req, res) => {
  const { 
    productId,
    updatePayload,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'productId', productId),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyProductUpdate(
    productId,
    updatePayload,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyProductUpdate,
  printifyProductUpdateApi,
};

// curl localhost:8000/printifyProductUpdate -H "Content-Type: application/json" -d '{ "productId": "67a3f38542eab3720306975b", "updatePayload": { ... } }'