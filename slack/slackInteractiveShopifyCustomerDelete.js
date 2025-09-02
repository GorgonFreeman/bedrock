// https://docs.slack.dev/reference/methods/chat.delete

const { funcApi, logDeep } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

const slackInteractiveShopifyCustomerDelete = async (
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

const slackInteractiveShopifyCustomerDeleteApi = funcApi(slackInteractiveShopifyCustomerDelete, {
  argNames: ['channelId', 'timestamp', 'options'],
  validatorsByArg: {
    channelId: Boolean,
    timestamp: Boolean,
  },
});

module.exports = {
  slackInteractiveShopifyCustomerDelete,
  slackInteractiveShopifyCustomerDeleteApi,
};

// curl localhost:8000/slackInteractiveShopifyCustomerDelete -H "Content-Type: application/json" -d '{ "channelId": "C06GAG30145", "timestamp": "1756218276.372199" }'