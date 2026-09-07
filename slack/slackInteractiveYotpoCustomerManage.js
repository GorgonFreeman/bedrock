const { HOSTED } = require('../constants');
const { respond, logDeep, customAxios } = require('../utils');
const { REGIONS_WF } = require( '../constants');

const COMMAND_NAME = 'yotpo_customer'; // slash command

const blocks = {

  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Yotpo customer management*`,
    },
  },

  region_select: {

    heading: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Select site:',
      },
    },

    buttons: {
      type: 'actions',
      elements: REGIONS_WF.map(region => ({
        type: 'button',
        text: {
          type: 'plain_text',
          text: region.toUpperCase(),
        },
        value: region,
        action_id: `${ COMMAND_NAME }:region_select:${ region }`,
      })),
    },

  },

  actions_select: {

    heading: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Select action:',
      },
    },

    buttons: {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Fetch customer',
          },
          value: 'fetch_customer',
          action_id: `${ COMMAND_NAME }:actions_select:fetch_customer`,
        },
      ],
    },

  },

  fetch_customer: {

    email_phone_input: (region) => {
      return {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: `${ COMMAND_NAME }:fetch_customer:email_phone_input:${ region }`,
        },
        label: {
          type: 'plain_text',
          text: 'Customer email or phone number',
        },
      };
    },

    buttons: (region) => {
      return {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Submit',
            },
            value: 'submit',
            action_id: `${ COMMAND_NAME }:fetch_customer:submit:${ region }`,
          },
        ],
      };
    },

    loading: (region) => {
      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Fetching customer from ${ region }...`,
        },
      };
    },

    error: (region) => {
      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Error fetching customer from ${ region }`,
        },
      };
    },
  }

}

const slackInteractiveYotpoCustomerManage = async (req, res) => {
  logDeep('slackInteractiveYotpoCustomerManage');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      blocks.region_select.heading,
      blocks.region_select.buttons,
    ];

   logDeep('initialBlocks', initialBlocks);

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

  !HOSTED && logDeep({
    responseUrl,
    state,
    actionId,
    actionValue,
  });

  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  let response;

  switch (actionName) {
    case 'region_select':

      break;

    case 'actions_select':

      break;

    case 'fetch_customer':

      break;

    default:

      break;
  };

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

module.exports = slackInteractiveYotpoCustomerManage;