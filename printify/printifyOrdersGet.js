const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyGet } = require('../printify/printify.utils');

const printifyOrdersGet = async (
  {
    credsPath,
    shopId,
    perPage,
    status, // "on-hold", "in-production", "sending-to-production", "has-issues", "fulfilled", "canceled"
    sku,
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

  const params = {
    ...perPage ? { limit: perPage } : {},
    ...status ? { status } : {},
    ...sku ? { sku } : {},
  };

  const response = await printifyGet(
    `/shops/${ shopId }/orders.json`, // url
    {
      // customAxios payload
      params,
      
      // client args
      credsPath,
      
      ...getterOptions,
    },
  );

  return response;
};

const printifyOrdersGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await printifyOrdersGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrdersGet,
  printifyOrdersGetApi,
};

// curl localhost:8000/printifyOrdersGet
// curl localhost:8000/printifyOrdersGet -H "Content-Type: application/json" -d '{ "options": { "perPage": 100, "status": "on-hold" } }'