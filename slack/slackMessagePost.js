// https://docs.slack.dev/reference/methods/chat.postmessage

const { funcApi, objHasAny, logDeep } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

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
  
  const response = await slackClient.fetch({
    url: '/chat.postMessage',
    method: 'post',
    body: {
      channel,
      ...text && { text },
      ...blocks && { blocks },
      ...markdownText && { markdown_text: markdownText },
    },
    context: {
      credsPath,
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