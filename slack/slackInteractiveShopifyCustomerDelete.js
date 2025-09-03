const { respond, logDeep, customAxios } = require('../utils');

const ACTION_NAME = 'customer_delete';

const slackInteractiveShopifyCustomerDelete = async (req, res) => {

  console.log('slackInteractiveShopifyCustomerDelete');

  const { body } = req;

  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    const initialBlocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Customer Data Delete',
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'input',
        block_id: `email_input_field`,
        element: {
          type: 'plain_text_input',
          action_id: `${ ACTION_NAME }:email_input`,
        },
        label: {
          type: 'plain_text',
          text: 'Customer email address:',
          emoji: true,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            "type": "button",
            text: {
              type: 'plain_text',
              text: 'Cancel',
              emoji: true,
            },
            value: 'cancel',
            action_id: `${ ACTION_NAME }:cancel`,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Find Customer',
              emoji: true,
            },
            value: 'fetch_customer',
            action_id: `${ ACTION_NAME }:fetch_customer`,
            style: 'primary',
          },
        ],
      },
    ];

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }

  console.log(`Received payload - handling as interactive step`);

  respond(res, 200); // Acknowledgement - we'll provide the next step to the response_url later

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

  let response;

  switch (actionId) {
    case `${ ACTION_NAME }:fetch_customer`:
      
      const customerEmail = state?.values?.email_input_field[`${ ACTION_NAME }:email_input`]?.value;
      logDeep('customerEmail', customerEmail);

      break;
    case `${ ACTION_NAME }:cancel`:

      response = {
        replace_original: 'true',
        text: `No problem!`,
      };

      break;
    default:
      throw new Error(`Unknown action: ${ actionId }`);
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveShopifyCustomerDelete;