const { respond, mandateParam, credsByPath, CustomAxiosClient, logDeep } = require('../utils');
const { iwishClient } = require('../iwish/iwish.utils');

const FUNC = async (
  credsPath,
  customerId,
  {
    option,
  } = {},
) => {

  const response = await iwishClient.fetch({
    url: `/V2/fetchWishlistData/${ customerId }`,
    context: {
      credsPath,
    },
  });
  logDeep('response', response);
  return response;
};

const FUNCApi = async (req, res) => {
  const { 
    credsPath,
    customerId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerId', customerId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await FUNC(
    credsPath,
    customerId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerId": "2700981665864" }'