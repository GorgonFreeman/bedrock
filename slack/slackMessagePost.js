// https://docs.slack.dev/reference/methods/chat.postmessage

const { funcApi, objHasAny, logDeep } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

const slackMessagePost = async (
  {
    channelName,
    channelId,
  },
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
      channel: channelId || channelName,
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
  argNames: ['channelIdentifier', 'messagePayload', 'options'],
  validatorsByArg: {
    channelIdentifier: p => objHasAny(p, ['channelName', 'channelId']),
    messagePayload: p => objHasAny(p, ['text', 'blocks', 'markdownText']),
  },
});

module.exports = {
  slackMessagePost,
  slackMessagePostApi,
};

// curl localhost:8000/slackMessagePost -H "Content-Type: application/json" -d '{ "channelIdentifier": { "channelName": "#hidden_testing" }, "messagePayload": { "text": "new number, who dis?" } }'