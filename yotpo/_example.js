const { funcApi, logDeep } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const FUNC = async ( 
  credsPath,
  {
    apiVersion,
  } = {},
) => {

  const response = await yotpoClient.fetch({
    url: `/endpoint`,
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['credsPath'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "credsPath": "au" }'