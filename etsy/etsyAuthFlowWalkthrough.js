const { funcApi, logDeep, askQuestion } = require('../utils');

const etsyAuthFlowWalkthrough = async (
  {
    credsPath,
  } = {},
) => {
  
};

const etsyAuthFlowWalkthroughApi = funcApi(etsyAuthFlowWalkthrough, {
  argNames: ['options'],
});

module.exports = {
  etsyAuthFlowWalkthrough,
  etsyAuthFlowWalkthroughApi,
};

// curl localhost:8000/etsyAuthFlowWalkthrough