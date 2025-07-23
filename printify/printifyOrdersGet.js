const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyOrdersGet = async (
  {
    credsPath,
    shopId,
    perPage,
    status, // "on-hold", "in-production", "sending-to-production", "has-issues", "fulfilled", "canceled"
    sku,
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

  const allItems = [];
  let done = false;
  let page;

  while (!done) {
    const response = await printifyClient.fetch({
      url: `/shops/${ shopId }/orders.json`,
      params: {
        ...params,
        page,
      }, 
      verbose: true,
      credsPath,
    });

    if (!response?.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    const { 
      current_page, 
      last_page,
      data: items, 
    } = response.result;

    allItems.push(...items);

    if (current_page === last_page) {
      done = true;
    }

    page = current_page + 1;
  }

  return {
    success: true,
    result: allItems,
  };  
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