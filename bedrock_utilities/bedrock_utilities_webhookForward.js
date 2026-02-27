// A function that responds quickly to a webhook, and sends the webhook where it needs to go. 
// This is to separate the response from the action taken.

const { funcApi } = require('../utils');

const bedrock_utilities_webhookForward = async (
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

const bedrock_utilities_webhookForwardApi = funcApi(bedrock_utilities_webhookForward, {
  argNames: ['arg', 'options'],
});

module.exports = {
  bedrock_utilities_webhookForward,
  bedrock_utilities_webhookForwardApi,
};

// curl localhost:8000/bedrock_utilities_webhookForward -H "Content-Type: application/json" -d '{ "arg": "1234" }'