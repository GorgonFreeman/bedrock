const { respond, logDeep, customAxios } = require('../utils');

const COMMAND_NAME = 'dev__product_data_check'; // slash command

const blocks = {
  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Let's check product data!`,
    },
  },

  sku_input: {
    heading: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Enter SKU to check*',
      },
    },
    errorDisplay: (errorMessage) => {
      return {
        type: 'section',
        block_id: 'sku_input:error',
        text: {
          type: 'mrkdwn',
          text: `:warning: ${ errorMessage }`,
        },
      };
    },
    textfield: {
      type: 'input',
      block_id: 'sku_input:textfield',
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:sku_input:textfield`,
        multiline: false,
      },
      label: {
        type: 'plain_text',
        text: ' ',
      },
    },
    buttons: {
      type: 'actions',
      block_id: 'sku_input:buttons',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Submit',
          },
          action_id: `${ COMMAND_NAME }:sku_input:submit`,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Cancel',
          },
          action_id: `${ COMMAND_NAME }:sku_input:cancel`,
        },
      ],  
    },
  },

  cancel: {
    type: 'actions',
    block_id: 'cancel',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Submit',
        },
        action_id: `${ COMMAND_NAME }:sku_input:submit`,
      },
    ],
  },
}

const slackInteractiveProductDataCheck = async (req, res) => {
  console.log('slackInteractiveProductDataCheck');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      blocks.sku_input.heading,
      blocks.sku_input.textfield,
      blocks.sku_input.buttons,
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

  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  logDeep({
    responseUrl,
    state,
    actionId,
    actionValue,
  });

  let response;

  switch (actionName) {

    case 'sku_input':
      switch (actionNodes?.[0]) {

        case 'submit':
          const textFieldValue = state?.values?.['sku_input:textfield']?.[`${ COMMAND_NAME }:sku_input:textfield`]?.value;
          const sku = textFieldValue?.trim();
          
          if (!sku) {
            response = {
              replace_original: 'true',
              blocks: [
                blocks.intro,
                blocks.sku_input.heading,
                blocks.sku_input.errorDisplay('Please enter a valid SKU'),
                blocks.sku_input.textfield,
                blocks.sku_input.buttons,
              ],
            };
            break;
          }

          logDeep({ sku });

          break;

        case 'cancel':
          response = {
            delete_original: 'true',
          };
          break;

        default:
          console.warn(`Unknown actionNode: ${ actionNodes?.[0] }`);
          break;
      }
      break;

    case 'cancel':
      response = {
        delete_original: 'true',
      };
      break;

    default:
      console.warn(`Unknown actionName: ${ actionName }`);
      break;
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveProductDataCheck;