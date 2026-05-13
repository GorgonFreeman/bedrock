const { respond, logDeep, customAxios, askQuestion } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH } = require('../slack/slack.constants');
const { DEV_PROJECT_ID, DEV_DEFAULT_SECTION_ID, DEV_ASSIGNEE_EMAILS } = require('../asana/asana.constants');
const { slackClient } = require('../slack/slack.utils');
const { slackMessagePost } = require('../slack/slackMessagePost');
const { asanaTaskCreate } = require('../asana/asanaTaskCreate');
const { asanaSectionAddTask } = require('../asana/asanaSectionAddTask');

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

  assignee_select: {
    type: 'section',
    block_id: 'assignee_select',
    text: {
      type: 'mrkdwn',
      text: 'Choose assignee:',
    },
    accessory: {
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text: 'Choose assignee',
      },
      initial_option: {
        text: {
          type: 'plain_text',
          text: Object.keys(DEV_ASSIGNEE_EMAILS)[0],
        },
        value: Object.values(DEV_ASSIGNEE_EMAILS)[0],
      },
      options: Object.entries(DEV_ASSIGNEE_EMAILS).map(([assignee, email]) => ({
        text: {
          type: 'plain_text',
          text: assignee,
        },
        value: email,
      })),
      action_id: `${ COMMAND_NAME }:assignee_select`,
    },
  },

  error_message: (errorMessage) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: ${ errorMessage }`,
      },
    };
  },

  task_created: (userId, taskName, taskLink, taskDescription) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${ userId }> created a new dev task.\n\>*<${ taskLink }|${ taskName }>*\n${ taskDescription }`,
      },
    };
  },

};

const modal = {

  initial: (metadataObject, { errorMessage } = {}) => {
    return {
      type: 'modal',
      callback_id: COMMAND_NAME,
      title: {
        type: 'plain_text',
        text: 'Create new task',
      },
      blocks: [
        blocks.name_input,
        blocks.assignee_select,
        ...(errorMessage ? [ blocks.error_message(errorMessage) ] : []),
      ],
      private_metadata: JSON.stringify(metadataObject),
      close: {
        type: 'plain_text',
        text: 'Close',
      },
      submit: {
        type: 'plain_text',
        text: 'Create Task',
      },
    };
  },

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

    let metadataObject;

    switch(payloadType) {

      // this is a message action initiation - send the initial blocks in a modal
      case 'message_action':

        metadataObject = {
          messageText: payload?.message?.text,
          messageBlocks: payload?.message?.blocks,
          messageId: payload?.message?.ts,
          channelId: payload?.channel?.id,
          channelName: payload?.channel?.name,
        };

        return slackClient.fetch({
          url: '/views.open',
          method: 'post',
          body: {
            trigger_id: triggerId,
            view: modal.initial(metadataObject),
          },
          context: {
            credsPath,
          },
        });
        break;

      // this is a view submission - process the form data
      case 'view_submission':

        metadataObject = JSON.parse(payload.view.private_metadata);

        const {
          messageText,
          messageBlocks,
          channelId,
          channelName,
          messageId,
        } = metadataObject;

        const {
          name_input: nameInput,
        } = payload.view.state.values;

        const {
          id: userId,
        } = payload.user;
  
        const taskName = nameInput[`${ COMMAND_NAME }:name_input`]?.value;

        const assigneeEmail = payload.view.state.values.assignee_select[`${ COMMAND_NAME }:assignee_select`]?.selected_option?.value;

        // Create the dev task in Asana
        const asanaTaskCreateResult = await asanaTaskCreate(taskName, {
          projects: [ DEV_PROJECT_ID ],
          assignee: assigneeEmail || 'me',
          notes: [
            `> ${ messageText }`,
            ``,
            `Created from Slack:`,
            `https://${ teamDomain }.slack.com/archives/${ channelId }/p${ messageId.replace('.', '') }`,
          ].join('\n'),
        });
        
        if (!asanaTaskCreateResult.success) {
          return slackClient.fetch({
            url: '/views.update',
            method: 'post',
            body: {
              view: modal.initial(metadataObject, { errorMessage: asanaTaskCreateResult.error }),
            },
            context: {
              credsPath,
            },
          });
        }

        const {
          gid: taskId,
          permalink_url: taskLink,
        } = asanaTaskCreateResult.result;

        // Move task to Fresh In
        const asanaTaskMoveResult = await asanaSectionAddTask(
          {
            sectionId: DEV_DEFAULT_SECTION_ID,
          },
          taskId,
        );

        // Respond to the user with the task details in slack
        const taskDescription = [
          `> ${ messageText }`,
          `>`,
          `> Created from Slack:`,
          `> https://${ teamDomain }.slack.com/archives/${ channelId }/p${ messageId.replace('.', '') }`,
        ].join('\n');

        return slackMessagePost(
          {
            channelId: channelId,
          },
          {
            blocks: [ blocks.task_created(userId, taskName, taskLink, taskDescription) ],
          },
          {
            credsPath,
          },
        );
        break;

      default:
        break;
    }
  }
};

module.exports = slackInteractiveAsanaDevTaskCreate;