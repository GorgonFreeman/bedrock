// https://docs.slack.dev/reference/methods/chat.delete/

const { funcApi, logDeep } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

const slackMessageDelete = async (
  channel,
  timestamp,
  {
    credsPath,
  } = {},
) => {
  const response = await slackClient.fetch({
    url: '/chat.delete',
    method: 'post',
    body: {
      channel,
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
  argNames: ['channel', 'timestamp', 'options'],
  validatorsByArg: {
    channel: Boolean,
    timestamp: Boolean,
  },
});

module.exports = {
  slackMessageDelete,
  slackMessageDeleteApi,
};

// curl localhost:8000/slackMessageDelete -H "Content-Type: application/json" -d '{ "arg": "1234" }'