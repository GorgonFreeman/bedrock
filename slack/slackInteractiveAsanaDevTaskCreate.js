const { respond, logDeep, customAxios } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH } = require('../slack/slack.constants');
const { slackClient } = require('../slack/slack.utils');

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
  
  // message action - payload required
  if (!body?.payload) {

    console.warn(`Payload required for message action`);
    return respond(res, 400, { error: `Payload required for message action` });
  }

  // Because we got to this point, we have a payload - handle as an interactive step
  respond(res, 200); // Acknowledge immediately - we'll provide the next step to the response_url later

  const payload = JSON.parse(body.payload);
  logDeep('payload', payload);

  const {
    trigger_id: triggerId,
    type: payloadType,
    team,
  } = payload;

  const { domain: teamDomain } = team;
  // const credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];
  const credsPath = 'dev'; // temporarily hardcoded for testing

  // No actions in payload
  if (!payload?.actions) {

    switch(payloadType) {

      // this is a message action initiation - send the initial blocks in a modal
      case 'message_action':

        repsonse = await slackClient.fetch({
          url: '/views.open',
          method: 'post',
          body: {
            trigger_id: triggerId,
            view: modal.initial,
          },
          context: {
            credsPath,
          },
        });
        break;

      // this is a view submission - process the form data
      case 'view_submission':

        const {
          name_input: nameInput,
        } = payload.view.state.values;
  
        const taskName = nameInput[`${ COMMAND_NAME }:name_input`]?.value;
  
        console.log('taskName', taskName);
        break;

      default:
        break;
    }
  }
};

module.exports = slackInteractiveAsanaDevTaskCreate;