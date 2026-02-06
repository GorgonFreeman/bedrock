// https://developers.asana.com/reference/getuser

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const FUNC = async (
  thingId,
  {
    credsPath,
  } = {},
) => {

  const response = await asanaClient.fetch({
    url: `/things/${ thingId }`,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['thingId', 'options'],
  validatorsByArg: {
    thingId: Boolean,
  },
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC