const { respond, logDeep, customAxios } = require('../utils');

const COMMAND_NAME = 'customer_bday_code_create'; // slash command

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
        block_id: 'state:email',
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
        elements: REGIONS_WF.map(region => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: region.toUpperCase(),
          },
          value: region,
          action_id: `${ COMMAND_NAME }:store_select:${ region }`,
        })),
      },
    ],
  },
  cancel: {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Cancel',
        },
        value: 'cancel',
        action_id: `${ COMMAND_NAME }:cancel`,
      },
    ],
  },
};

const slackInteractiveBirthdayDiscountCodeGenerate = async (req, res) => {
  console.log('slackInteractiveBirthdayDiscountCodeGenerate');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      ...blocks.email_select.ask,
      blocks.cancel,
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

module.exports = slackInteractiveBirthdayDiscountCodeGenerate;