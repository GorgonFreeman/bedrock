const { funcApi, logDeep } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

const slackInteractiveStockCheck = async (
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

const slackInteractiveStockCheckApi = funcApi(slackInteractiveStockCheck, {
  argNames: ['channelId', 'timestamp', 'options'],
});

module.exports = {
  slackInteractiveStockCheck,
  slackInteractiveStockCheckApi,
};

// curl localhost:8000/slackInteractiveStockCheck -H "Content-Type: application/json" -d '{ "channelId": "C06GAG30145", "timestamp": "1756218276.372199" }'