const { funcApi, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const FUNC = async (
  arg,
  {
    credsPath,
    option,
  } = {},
) => {

  const response = await printifyClient.fetch({
    url: '/things.json', 
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
  
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['arg', 'options'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "arg": "1234" }'