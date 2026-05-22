// https://developers.asana.com/reference/getuser

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaSectionGetByName = async (
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

const asanaSectionGetByNameApi = funcApi(asanaSectionGetByName, {
  argNames: ['thingId', 'options'],
  validatorsByArg: {
    thingId: Boolean,
  },
});

module.exports = {
  asanaSectionGetByName,
  asanaSectionGetByNameApi,
};

// curl localhost:8000/asanaSectionGetByName