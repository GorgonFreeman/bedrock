// https://docs.slack.dev/reference/methods/chat.postmessage

const { funcApi, objHasAny, credsByPath, customAxios } = require('../utils');

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

  const creds = credsByPath(['slack', credsPath]);
  const { 
    BASE_URL,
    BOT_TOKEN,
    SIGNING_SECRET,
  } = creds;
 
  
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