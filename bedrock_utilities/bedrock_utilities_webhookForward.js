// A function that responds quickly to a webhook, and sends the webhook where it needs to go. 
// This is to separate the response from the action taken.

require('dotenv').config();

const { funcApi, customAxios } = require('../utils');

const bedrock_utilities_webhookForward = async (req) => {

  const { headers, body, query } = req;

  let forwardUrl;

  // Allow passing forward url in a number of ways, by preference.

  // 1. From options arg in body
  if (!forwardUrl) {
    const { options } = body;
    const { forwardUrl: optionsForwardUrl } = options;
    if (optionsForwardUrl) {
      forwardUrl = optionsForwardUrl;
    }
  }

  // 2. From query string
  if (!forwardUrl) {
    const { forwardUrl: queryStringForwardUrl } = query;
    if (queryStringForwardUrl) {
      forwardUrl = queryStringForwardUrl;
    }
  }

  // 3. From custom header
  if (!forwardUrl) {
    const { 'x-forward-url': customHeaderForwardUrl } = headers;
    if (customHeaderForwardUrl) {
      forwardUrl = customHeaderForwardUrl;
    }
  }
  
  // 4. From environment variables
  const { env } = process;
  const { FORWARD_URL } = env;
  if (!forwardUrl) {
    forwardUrl = FORWARD_URL;
  }

  customAxios('post', forwardUrl, { 
    metadata: { 
      headers,
    }, 
    ...body,
  });

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