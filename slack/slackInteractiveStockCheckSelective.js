const { HOSTED } = require('../constants');
const { respond, logDeep, customAxios } = require('../utils');
const { REGIONS_WF } = require('../constants');

const COMMAND_NAME = 'dev__stock_check_selective'; // slash command

const DEFAULT_CONFIG = {
  minDiff: 3,
};

const VARIANT_FETCH_QUERIES_BY_STORE = {
  au: [
    'tag_not:inv_hold',
  ],
  us: [
    'tag_not:not_for_radial',
    'tag_not:inv_hold_us',
  ],
  uk: [
    'tag_not:inv_hold_uk',
  ],
};

const blocks = {
  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Let's do a stock check!`,
    },
  },

  settings: {
    heading: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Settings*',
      },
    },

    state: (minDiff, { region } = {}) => {
      return {
        type: 'section',
        block_id: 'settings:state',
        text: {
          type: 'mrkdwn',
          text: [
            minDiff,
            ...region ? [region] : [],
          ].join('|'),
        },
      };
    },

    inputs: (minDiff) => {
      return {
        type: 'actions',
        block_id: 'settings:inputs',
        elements: [
          {
            type: 'static_select',
            action_id: `${ COMMAND_NAME }:settings:min_diff`,
            placeholder: {
              type: 'plain_text',
              text: 'Min diff',
            },
            options: Array.from({ length: 11 }, (_, i) => ({
              text: {
                type: 'plain_text',
                text: String(i),
              },
              value: String(i),
            })),
            initial_option: {
              text: {
                type: 'plain_text',
                text: String(minDiff),
              },
              value: String(minDiff),
            },
          },
        ],
      };
    },
  },
  region_select: {
    heading: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Select your store to start the check* :hugging_face:',
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
  
  cancel: {
    type: 'actions',
    block_id: 'cancel',
    elements: [
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

  result: (regionDisplay, sheetUrl, { mentionUserId } = {}) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ mentionUserId ? `Hey <@${ mentionUserId }>! ` : '' }Stock check for ${ regionDisplay }: <${ sheetUrl }|:google_sheets:>`,
      },
    };
  },
};

const slackInteractiveStockCheckSelective = async (req, res) => {
  console.log('slackInteractiveStockCheckSelective');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

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

module.exports = slackInteractiveStockCheckSelective;