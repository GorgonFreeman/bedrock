const { respond, logDeep, customAxios } = require('../utils');

const COMMAND_NAME = 'dev_task_form'; // slash command

const blocks = {

  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Create a task for the dev team*`,
    },
  },

  title_input: {
    type: 'input',
    block_id: 'title_input',
    label: {
      type: 'plain_text',
      text: 'Title',
    },
    element: {
      type: 'plain_text_input',
    },
  },

  description_input: {
    type: 'input',
    block_id: 'description_input',
    label: {
      type: 'plain_text',
      text: 'Description',
    },
    element: {
      type: 'plain_text_input',
      "multiline": true,
    },
  },
  
  buttons: {
    type: 'actions',
    block_id: 'buttons',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Submit',
        },
        action_id: `${ COMMAND_NAME }:submit`,
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

};

const slackInteractiveLinearTaskCreate = async (req, res) => {
  console.log('slackInteractiveLinearTaskCreate');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      blocks.title_input,
      blocks.description_input,
      blocks.buttons,
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

  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  let response;

  switch (actionName) {

    case 'submit':

      response = {
        replace_original: 'true',
        blocks: [blocks.intro],
      };
      break;

    case 'cancel':

      response = {
        delete_original: 'true',
      };
      break;

    default:
      console.warn(`Unknown actionName: ${ actionName }`);
      return;
  }

  return respond(res, 200, response);
};

module.exports = slackInteractiveLinearTaskCreate;