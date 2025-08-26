// https://docs.slack.dev/reference/methods/chat.postmessage

const { funcApi, objHasAny } = require('../utils');

const slackMessagePost = async (
  channel,
  {
    text,
    blocks,
    markdownText,
  },
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
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

// curl localhost:8000/slackMessagePost -H "Content-Type: application/json" -d '{ "arg": "1234" }'