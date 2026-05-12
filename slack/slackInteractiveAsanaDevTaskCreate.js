const { respond, logDeep, customAxios } = require('../utils');

const COMMAND_NAME = 'asana_dev_task_create'; // slash command

const blocks = {

  name_input: {
    type: 'input',
    block_id: 'name_input',
    label: {
      type: 'plain_text',
      text: 'Task name',
    },
    element: {
      type: 'plain_text_input',
      action_id: `${ COMMAND_NAME }:name_input`,
      placeholder: {
        type: 'plain_text',
        text: 'Enter task name...',
      },
    },
  },

};

const modal = {

  initial: {
    type: 'modal',
    callback_id: COMMAND_NAME,
    title: {
      type: 'plain_text',
      text: 'Create new task',
    },
    blocks: [
      blocks.name_input,
    ],
    close: {
      type: 'plain_text',
      text: 'Close',
    },
    submit: {
      type: 'plain_text',
      text: 'Create Task',
    },
  }
}

const slackInteractiveAsanaDevTaskCreate = async (req, res) => {
  console.log('slackInteractiveAsanaDevTaskCreate');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

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

module.exports = slackInteractiveAsanaDevTaskCreate;