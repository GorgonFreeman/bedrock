const { funcApi, credsByPath, CustomAxiosClient, logDeep } = require('../utils');
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['credsPath', 'customerId', 'options'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerId": "2700981665864" }'