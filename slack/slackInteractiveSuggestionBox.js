// https://docs.slack.dev/reference/methods/chat.delete

const { funcApi, logDeep } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

const slackInteractiveSuggestionBox = async (
  channelId,
  timestamp,
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

const slackInteractiveSuggestionBoxApi = funcApi(slackInteractiveSuggestionBox, {
  argNames: ['channelId', 'timestamp', 'options'],
  validatorsByArg: {
    channelId: Boolean,
    timestamp: Boolean,
  },
});

module.exports = {
  slackInteractiveSuggestionBox,
  slackInteractiveSuggestionBoxApi,
};

// curl localhost:8000/slackInteractiveSuggestionBox -H "Content-Type: application/json" -d '{ "channelId": "C06GAG30145", "timestamp": "1756218276.372199" }'