const { respond, logDeep, customAxios } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { collabsCustomerErase } = require('../collabs/collabsCustomerErase');

const COMMAND_NAME = 'customer_delete'; // slash command

const blocks = {
  email_select: {
    ask: [
      {
        type: 'input',
        block_id: 'email_input',
        label: {
          type: 'plain_text',
          text: 'Email Address',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'email',
          placeholder: {
            type: 'plain_text',
            text: 'Enter email address',
          },
        },
      },
      {
        type: 'actions',
        block_id: 'email_actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Save',
            },
            action_id: `${ COMMAND_NAME }:email:save`,
            style: 'primary',
          },
        ],
      },
    ],
    display: (emailAddress) => {
      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Email: ${ emailAddress }`,
        },
      };
    },
  },
  store_select: {
    ask: [
      {
        type: 'actions',
        block_id: 'store_select_actions',
        elements: [
          {
            type: 'checkboxes',
            action_id: `${ COMMAND_NAME }:store_select`,
            options: REGIONS_WF.map(region => ({
              text: {
                type: 'plain_text',
                text: region.toUpperCase(),
              },
              value: region,
            })),
          },
        ],
      },
    ],
  }
};

const slackInteractiveCustomerDelete = async (req, res) => {
  console.log('slackInteractiveCustomerDelete');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      ...blocks.email_select.ask,
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
    case 'email':

      switch (actionNodes?.[0]) {

        case 'save':
          const emailAddress = state?.values?.email_input?.email?.value || '';
          logDeep('emailAddress', emailAddress);
          response = {
            replace_original: 'true',
            blocks: [
              blocks.email_select.display(emailAddress),
              ...blocks.store_select.ask,
            ],
          };
          break;

        default:
          console.warn(`Unknown actionNode: ${ actionNodes?.[0] }`);
          return;
      }
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

module.exports = slackInteractiveCustomerDelete;