// https://docs.slack.dev/reference/methods/chat.delete/

const { funcApi, logDeep } = require('../utils');
const { slackClient, slackChannelNameToId } = require('../slack/slack.utils');

const slackMessageDelete = async (
  {
    channelId,
    channelName,
  },
  timestamp,
  {
    credsPath,
  } = {},
) => {

  if (!channelId) {
    channelId = slackChannelNameToId(channelName, { credsPath });
  }

  if (!channelId) {
    return {
      success: false,
      error: ['No channel id resolved'],
    };
  }

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

const slackMessageDeleteApi = funcApi(slackMessageDelete, {
  argNames: ['channelIdentifier', 'timestamp', 'options'],
  validatorsByArg: {
    channelIdentifier: p => objHasAny(p, ['channelId', 'channelName']),
    timestamp: Boolean,
  },
});

module.exports = {
  slackMessageDelete,
  slackMessageDeleteApi,
};

// curl localhost:8000/slackMessageDelete -H "Content-Type: application/json" -d '{ "channelIdentifier": { "channelId": "C06GAG30145" }, "timestamp": "1756218276.372199" }'
// curl localhost:8000/slackMessageDelete -H "Content-Type: application/json" -d '{ "channelIdentifier": { "channelName": "#hidden_testing" }, "timestamp": "1756218276.372199" }'