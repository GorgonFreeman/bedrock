// https://docs.slack.dev/reference/methods/chat.postmessage

const { funcApi, objHasAny, credsByPath, CustomAxiosClient, logDeep } = require('../utils');

const slackMessagePost = async (
  channel,
  {
    text,
    blocks,
    markdownText,
  },
  {
    credsPath,
  } = {},
) => {
  
  const slackRequestSetup = ({ credsPath } = {}) => {
    const creds = credsByPath(['slack', credsPath]);
    const { 
      BASE_URL,
      BOT_TOKEN,
    } = creds;
  
    const headers = {
      'Authorization': `Bearer ${ BOT_TOKEN }`,
    };
  
    return {
      baseUrl: BASE_URL,
      headers,
    };
  };

  const slackClient = new CustomAxiosClient({
    preparer: slackRequestSetup,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const response = await slackClient.fetch({
    url: '/chat.postMessage',
    method: 'post',
    body: {
      channel,
      ...text && { text },
      ...blocks && { blocks },
      ...markdownText && { markdown_text: markdownText },
    },
  });
  
  logDeep(response);
  return response;
};

const slackMessagePostApi = funcApi(slackMessagePost, {
  argNames: ['channel', 'messagePayload', 'options'],
  validatorsByArg: {
    channel: Boolean,
    messagePayload: p => objHasAny(p, ['text', 'blocks', 'markdownText']),
  },
});

module.exports = {
  slackMessagePost,
  slackMessagePostApi,
};

// curl localhost:8000/slackMessagePost -H "Content-Type: application/json" -d '{ "channel": "#hidden_testing", "messagePayload": { "text": "new number, who dis?" } }'