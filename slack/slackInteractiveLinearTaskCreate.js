const { respond, logDeep, customAxios, capitaliseString, askQuestion } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH, DEV_CHANNEL_ID } = require('../slack/slack.constants');

const { priorityHandleToId } = require('../bedrock_unlisted/mappings');

const { slackClient } = require('../slack/slack.utils');
const { slackMessagePost } = require('../slack/slackMessagePost');
const { linearDevIssueCreate } = require('../linear/linearDevIssueCreate');

const COMMAND_NAME = 'dev_task_form'; // slash command

const blocks = {

  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Create a task for the dev team*`,
    },
  },

  title_input: (initialValue = '') => {
      return {
      type: 'input',
      block_id: 'title_input',
      label: {
        type: 'plain_text',
        text: 'Title',
      },
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:title_input`,
        ...initialValue && { initial_value: initialValue },
      },
    };
  },

  description_input: (initialValue = '') => {
    return {
      type: 'input',
      block_id: 'description_input',
      label: {
        type: 'plain_text',
        text: 'Description',
      },
      element: {
        type: 'plain_text_input',
        multiline: true,
        ...initialValue && { initial_value: initialValue },
        action_id: `${ COMMAND_NAME }:description_input`,
      },
    };
  },

  priority_select: (initialValue = 'medium') => {
    return {
      type: 'input',
      block_id: 'priority_select',
      label: {
        type: 'plain_text',
        text: 'Priority',
      },
      element: {
        type: 'static_select',
        action_id: `${ COMMAND_NAME }:priority_select`,
        options: Object.keys(priorityHandleToId).map((handle) => ({
          text: { type: 'plain_text', text: capitaliseString(handle) },
          value: handle,
        })),
        initial_option: {
          text: { type: 'plain_text', text: capitaliseString(initialValue) },
          value: initialValue,
        },
      },
    };
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

  error_block: (message) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Error:* ${ message }`,
      },
    };
  },

  result: (message) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    };
  },

};

const modal = {

  initial: (metadata = {}) => {
    const { messageText = '' } = metadata;
    return {
      type: 'modal',
      callback_id: COMMAND_NAME,
      title: {
        type: 'plain_text',
        text: 'Create a dev task',
      },
      blocks: [
        blocks.intro,
        blocks.title_input(),
        blocks.description_input(messageText),
        blocks.priority_select(),
      ],
      private_metadata: JSON.stringify(metadata),
      close: {
        type: 'plain_text',
        text: 'Close',
      },
      submit: {
        type: 'plain_text',
        text: 'Create task',
      },
    };
  },

}

const slackInteractiveLinearTaskCreate = async (req, res) => {
  console.log('slackInteractiveLinearTaskCreate');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      blocks.title_input(),
      blocks.description_input(),
      blocks.priority_select(),
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
    trigger_id: triggerId,
    type: payloadType,
    team,
  } = payload;

  const { domain: teamDomain } = team;
  const credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

  // No actions in payload - this is a message shortcut or modal action
  if (!payload?.actions) {

    let metadataObject;

    switch(payloadType) {

      // this is a message action initiation - send the initial blocks in a modal
      case 'message_action':

        metadataObject = {
          messageText: payload?.message?.text,
          messageBlocks: payload?.message?.blocks,
          messageId: payload?.message?.ts,
          // Send to dev channel if direct message or private group
          channelId: payload?.channel?.id,
          channelName: payload?.channel?.name,
          ...(payload?.message?.files?.length > 0 && { messageFiles: payload?.message?.files.map(file => ({
              name: file.name,
              url: file.permalink,
            })),
          }),
        };

        return slackClient.fetch({
          url: '/views.open',
          method: 'post',
          body: {
            trigger_id: triggerId,
            view: modal.initial(metadataObject),
          },
          context: {
            // credsPath: 'dev',
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

        const messageFiles = metadataObject?.messageFiles || [];

        const {
          title_input: titleInput,
          description_input: descriptionInput,
          priority_select: prioritySelect,
        } = payload.view.state.values;

        const {
          id: userId,
          name: callerUserName,
        } = payload.user;

        // Fetch title and description from message and form
        const taskTitle = titleInput[`${ COMMAND_NAME }:title_input`]?.value;
        const taskDescription = [
          `Created from Slack by \`${ callerUserName }\``,
          ``,
          `${ descriptionInput[`${ COMMAND_NAME }:description_input`]?.value || messageText }`,
          ...messageId ? [`https://${ teamDomain }.slack.com/archives/${ channelId }/p${ messageId.replace('.', '') }`] : [],
        ].join('\n');
        const priority = prioritySelect[`${ COMMAND_NAME }:priority_select`]?.selected_option?.value;

        logDeep({
          taskTitle,
          taskDescription,
          priority,
        });
        await askQuestion('Continue?');

        // Create task in linear
        const attrs = `id identifier title description state { id name } priority assignee { id name } team { id name } url`;
        const createTaskResponse = await linearDevIssueCreate(taskTitle, { description: taskDescription, priorityHandle: priority, attrs });
        const { success: createTaskSuccess, result: createTaskResult } = createTaskResponse;
        if (!createTaskSuccess) {
          console.error('Error creating dev task', createTaskResponse);
          return;
        }

        const {
          identifier: taskIdentifier,
          url: taskUrl,
        } = createTaskResult;
        
        await slackMessagePost(
          {
            channelId: DEV_CHANNEL_ID,
          },
          {
            blocks: [
              blocks.result(`Dev task created by \`${ callerUserName }\`!\n${ taskTitle } | ${ taskIdentifier } | <${ taskUrl }|View in Linear>`),
            ],
          },
          {
            credsPath,
          },
        );

        break;

      default:
        break;
    }

    return;
  }

  const { 
    response_url: responseUrl,
    state, 
    actions, 
    user,
  } = payload;

  const {
    id: callerUserId,
    name: callerUserName,
  } = user;

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

      const title = state.values.title_input[`${ COMMAND_NAME }:title_input`]?.value;
      const description = state.values.description_input[`${ COMMAND_NAME }:description_input`]?.value;
      const fullDescription = `Form submitted by \`${ callerUserName }\`\n\n${ description }`;
      const priority = state.values.priority_select[`${ COMMAND_NAME }:priority_select`]?.selected_option?.value;

      // Create task in linear
      const attrs = `id identifier title description state { id name } priority assignee { id name } team { id name } url`;
      const createTaskResponse = await linearDevIssueCreate(title, { description: fullDescription, priorityHandle: priority, attrs });
      const { success: createTaskSuccess, result: createTaskResult } = createTaskResponse;
      if (!createTaskSuccess) {
        console.error('Error creating dev task', createTaskResponse);
        response = {
          replace_original: 'true',
          blocks: [
            blocks.intro,
            blocks.title_input(title),
            blocks.description_input(description),
            blocks.priority_select(priority),
            blocks.error_block(JSON.stringify(createTaskResponse.error?.[0]?.data?.errors?.[0]?.message) || 'Error creating dev task'),
            blocks.buttons,
          ],
        };
        break;
      }
      
      // Respond with result
      const {
        title: taskTitle,
        identifier: taskIdentifier,
        url: taskUrl,
      } = createTaskResult;

      const resultMessage = `Dev task created successfully!\n${ taskTitle } | ${ taskIdentifier } | <${ taskUrl }|View in Linear>`;
      response = {
        replace_original: 'true',
        blocks: [blocks.result(resultMessage)],
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

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveLinearTaskCreate;