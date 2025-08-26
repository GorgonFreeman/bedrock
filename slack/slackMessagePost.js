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
 
  // Build the message payload
  const messagePayload = {};
  
  if (text) {
    messagePayload.text = text;
  }
  
  if (blocks) {
    messagePayload.blocks = blocks;
  }
  
  if (markdownText) {
    messagePayload.text = markdownText;
    messagePayload.mrkdwn = true;
  }
  
  // Ensure we have a channel and at least one message type
  if (!channel) {
    throw new Error('Channel is required');
  }
  
  if (!objHasAny(messagePayload, ['text', 'blocks'])) {
    throw new Error('At least one of text, blocks, or markdownText is required');
  }
  
  // Set the channel
  messagePayload.channel = channel;
  
  console.log('slackMessagePost payload', messagePayload);
  
  // Make the API call to Slack
  const response = await customAxios(`${ BASE_URL }/chat.postMessage`, {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${ BOT_TOKEN }`,
      'Content-Type': 'application/json',
    },
    body: messagePayload,
  });
  
  if (!response.success) {
    console.error('slackMessagePost error', response.error);
    throw new Error('Failed to post message to Slack');
  }
  
  console.log('slackMessagePost response', response.result);
  return response.result;
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