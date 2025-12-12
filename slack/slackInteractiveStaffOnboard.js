const { respond, logDeep, customAxios } = require('../utils');
const { SLACK_CHANNELS_MANAGERS } = require('../bedrock_unlisted/constants');

const COMMAND_NAME = 'staff_onboard'; // slash command
const ALLOWED_CHANNELS = SLACK_CHANNELS_MANAGERS;

const slackInteractiveStaffOnboard = async (req, res) => {
  console.log('slackInteractiveStaffOnboard');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const { channel_name: channelName } = body;
    
    if (!ALLOWED_CHANNELS.includes(channelName)) {
      return respond(res, 200, {
        response_type: 'ephemeral',
        text: `Hey, you can't use this command in this channel.`,
      });
    }

    const initialBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `I don't do anything yet :hugging_face:`,
        },
      },
    ];

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }

  // Because we got to this point, we have a payload - handle as an interactive step
  respond(res, 200); // Acknowledge immediately - we'll provide the next step to the response_url later

  const payload = JSON.parse(body.payload);
  logDeep('payload', payload);

  const { 
    response_url: responseUrl,
    state, 
    actions, 
  } = payload;

  const action = actions?.[0];
  const { 
    action_id: actionId,
    value: actionValue,
  } = action;

  logDeep({
    responseUrl,
    state,
    actionId,
    actionValue,
  });

  let response;

  response = {
    replace_original: 'true',
    text: `I don't do anything yet :hugging_face:`,
  };

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveStaffOnboard;