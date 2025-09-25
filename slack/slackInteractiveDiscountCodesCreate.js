// https://docs.slack.dev/reference/methods/chat.delete

const { funcApi, logDeep } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

const slackInteractiveDiscountCodesCreate = async (
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

const slackInteractiveDiscountCodesCreateApi = funcApi(slackInteractiveDiscountCodesCreate, {
  argNames: ['channelId', 'timestamp', 'options'],
});

module.exports = {
  slackInteractiveDiscountCodesCreate,
  slackInteractiveDiscountCodesCreateApi,
};

// curl localhost:8000/slackInteractiveDiscountCodesCreate -H "Content-Type: application/json" -d '{ "channelId": "C06GAG30145", "timestamp": "1756218276.372199" }'