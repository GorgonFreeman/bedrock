// https://docs.slack.dev/reference/methods/chat.postephemeral

const { funcApi, logDeep, objHasAny } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

const slackMessagePostEphemeral = async (
  {
    channelName,
    channelId,
  },
  {
    text,
    blocks,
    markdownText,
  },
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await slackClient.fetch({
    url: '/chat.delete',
    method: 'post',
    body: {
      channel: channelId,
      ts: timestamp,
    },
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const slackMessagePostEphemeralApi = funcApi(slackMessagePostEphemeral, {
  argNames: ['channelIdentifier', 'messagePayload', 'userId', 'options'],
  validatorsByArg: {
    channelIdentifier: p => objHasAny(p, ['channelName', 'channelId']),
    messagePayload: p => objHasAny(p, ['text', 'blocks', 'markdownText']),
    userId: Boolean,
  },
});

module.exports = {
  slackMessagePostEphemeral,
  slackMessagePostEphemeralApi,
};

// curl localhost:8000/slackMessagePostEphemeral -H "Content-Type: application/json" -d '{ "channelIdentifier": { "channelName": "#hidden_testing" }, "messagePayload": { "text": "new number, who dis?" }, "userId": "U06GAG30145" }'