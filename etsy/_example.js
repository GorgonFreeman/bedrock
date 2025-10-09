const { funcApi, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const FUNC = async (
  arg,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/things/${ arg }`,
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

// curl localhost:8000/FUNC