const { funcApi } = require('../utils');

const bedrock_utilities_WebhookForward = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const bedrock_utilities_WebhookForwardApi = funcApi(bedrock_utilities_WebhookForward, {
  argNames: ['arg', 'options'],
});

module.exports = {
  bedrock_utilities_WebhookForward,
  bedrock_utilities_WebhookForwardApi,
};

// curl localhost:8000/bedrock_utilities_WebhookForward -H "Content-Type: application/json" -d '{ "arg": "1234" }'