const { funcApi, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyAuthFlowWalkthrough = async (
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

const etsyAuthFlowWalkthroughApi = funcApi(etsyAuthFlowWalkthrough, {
  argNames: ['arg', 'options'],
});

module.exports = {
  etsyAuthFlowWalkthrough,
  etsyAuthFlowWalkthroughApi,
};

// curl localhost:8000/etsyAuthFlowWalkthrough