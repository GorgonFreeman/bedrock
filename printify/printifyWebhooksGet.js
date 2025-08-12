const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyGet } = require('../printify/printify.utils');

const printifyWebhooksGet = async (
  {
    credsPath,
    shopId,
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
    `/shops/${ shopId }/webhooks.json`, 
    {
      verbose: true,
      credsPath,
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const printifyWebhooksGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await printifyWebhooksGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyWebhooksGet,
  printifyWebhooksGetApi,
};

// curl localhost:8000/printifyWebhooksGet