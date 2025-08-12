const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyGet } = require('../printify/printify.utils');

const printifyProductsGet = async (
  {
    credsPath, 
    shopId,
    perPage,
    ...getterOptions
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

  const response = await printifyGet(
    `/shops/${ shopId }/products.json`, 
    {
      credsPath,
      params: {
        ...perPage ? { limit: perPage } : {},
      },
      ...getterOptions,
    },
  );

  logDeep(response);
  console.log(response.result.length);
  return response;
  
};

const printifyProductsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await printifyProductsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyProductsGet,
  printifyProductsGetApi,
};

// curl localhost:8000/printifyProductsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 15 } }'