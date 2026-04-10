const { respond, logDeep, customAxios } = require('../utils');
const { slackCommandRestrictToChannels } = require('../slack/slack.utils');

const { stylearcadeProductExport } = require('../stylearcade/stylearcadeProductExport');

const COMMAND_NAME = 'stylearcade_product_export'; // slash command
const ALLOWED_CHANNELS = ['stylearcadeproductexport', 'foxtron_testing'];

const blocks = {

  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Hey, I\'m going to run a Style Arcade product export for you. This will take a few minutes. Continue export?',
    },
  },

  buttons: {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Export',
        },
        value: 'export',
        action_id: `${ COMMAND_NAME }:export`,
      },
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

  loading: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Running Style Arcade product export...',
    },
  },

  error: (errorMessage) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Error exporting Style Arcade product: ${ errorMessage }`,
      },
    };
  },

  sheetBlock: (sheetUrl, sheetName) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ sheetName }: <${ sheetUrl }|:google_sheets:>`,
      },
    };
  },

};

const slackInteractiveStylearcadeProductExport = async (req, res) => {
  console.log('slackInteractiveStylearcadeProductExport');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    if (!slackCommandRestrictToChannels(req, res, ALLOWED_CHANNELS)) {
      return;
    }

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

module.exports = slackInteractiveStylearcadeProductExport;