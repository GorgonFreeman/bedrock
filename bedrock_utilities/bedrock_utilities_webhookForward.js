// A function that responds quickly to a webhook, and sends the webhook where it needs to go. 
// This is to separate the response from the action taken.

const { funcApi, customAxios } = require('../utils');

const bedrock_utilities_webhookForward = async (req) => {

  const { body } = req;

  const forwardUrl = 'TODO';

  customAxios('post', forwardUrl, { originalHeaders: headers, ...body });

  return { 
    success: true,
    message: `Webhook forwarded to ${ forwardUrl }`,
  };
  
};

const bedrock_utilities_webhookForwardApi = funcApi(
  bedrock_utilities_webhookForward,
  {
    passThroughReq: true,
  },
);

module.exports = {
  bedrock_utilities_webhookForward,
  bedrock_utilities_webhookForwardApi,
};

// curl localhost:8000/bedrock_utilities_webhookForward -H "Content-Type: application/json" -d '{ "arg": "1234" }'