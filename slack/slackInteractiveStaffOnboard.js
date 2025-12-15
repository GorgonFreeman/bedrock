const { respond, logDeep, customAxios } = require('../utils');
const { slackCommandRestrictToChannels } = require('../slack/slack.utils');
const { SLACK_CHANNELS_MANAGERS } = require('../bedrock_unlisted/constants');

const COMMAND_NAME = 'staff_onboard'; // slash command
const ALLOWED_CHANNELS = SLACK_CHANNELS_MANAGERS;

const blocks = {
  form: [
    {
      type: 'input',
      block_id: 'form_handle',
      label: {
        type: 'plain_text',
        text: `Email Handle, e.g. 'bailey'`,
      },
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:email_handle`,
      },
    },
    {
      type: 'input',
      block_id: 'form_first_name',
      label: {
        type: 'plain_text',
        text: 'First name',
      },
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:first_name`,
      },
    },
    {
      type: 'input',
      block_id: 'form_last_name',
      label: {
        type: 'plain_text',
        text: 'Last name',
      },
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:last_name`,
      },
    },
    {
      type: 'input',
      block_id: 'form_clothing_allowance',
      label: {
        type: 'plain_text',
        text: 'Clothing allowance',
      },
      optional: true,
      element: {
        type: 'checkboxes',
        action_id: `${ COMMAND_NAME }:add_clothing_allowance`,
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Add initial clothing allowance?',
            },
            value: 'add_clothing_allowance',
          },
        ],
      },
    },
    {
      type: 'actions',
      block_id: 'form_submit',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Submit',
          },
          action_id: `${ COMMAND_NAME }:submit`,
          style: 'primary',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Cancel',
          },
          action_id: `${ COMMAND_NAME }:cancel`,
        },
      ],
    },
  ],
};

const slackInteractiveStaffOnboard = async (req, res) => {
  console.log('slackInteractiveStaffOnboard');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    if (!slackCommandRestrictToChannels(req, res, ALLOWED_CHANNELS)) {
      return;
    }

    const initialBlocks = [
      ...blocks.form,
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

  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  switch (actionName) {
    case 'cancel':
      response = {
        delete_original: 'true',
      };
      break;

    default:
      console.warn(`Unknown actionName: ${ actionName }`);
      return;
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveStaffOnboard;