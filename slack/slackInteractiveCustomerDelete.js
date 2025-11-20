const { respond, logDeep, customAxios } = require('../utils');
const { collabsCustomerErase } = require('../collabs/collabsCustomerErase');

const COMMAND_NAME = 'customer_delete'; // slash command

const blocks = {
  email_select: {
    ask: {
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
    display: (emailAddress) => {
      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: emailAddress,
        },
      };
    },
  },
};

const slackInteractiveCustomerDelete = async (req, res) => {
  console.log('slackInteractiveCustomerDelete');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.email_select.ask,
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

module.exports = slackInteractiveCustomerDelete;