const { HOSTED } = require('../constants');
const { respond, logDeep, customAxios } = require('../utils');
const { REGIONS_WF } = require('../constants');

const COMMAND_NAME = 'dev__stock_check_selective'; // slash command

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
        text: '*Enter SKUs to check*',
      },
    },
    inputs: (skuList) => {
      return {
        type: 'actions',
        block_id: 'settings:inputs',
        elements: [
          {
            type: 'Plain_text_input',
            action_id: `${ COMMAND_NAME }:settings:sku_list`,
            multiline: true,
            placeholder: {
              type: 'plain_text',
              text: 'List of SKUs, one per line',
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

  result: (regionDisplay, stockCheckResults, { mentionUserId } = {}) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ mentionUserId ? `Hey <@${ mentionUserId }>! ` : '' }Stock check for ${ regionDisplay }`,
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
      blocks.intro,
      blocks.settings.heading,
      blocks.settings.inputs(DEFAULT_CONFIG.minDiff),
      blocks.region_select.heading,
      blocks.region_select.buttons,
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
    message,
    user,
  } = payload;

  const { id: callerUserId } = user;

  const {
    blocks: currentBlocks,
  } = message;
  const currentBlocksById = arrayToObj(currentBlocks, { keyProp: 'block_id' });

  settingsStateBlock = currentBlocksById['settings:state'];
  settingsInputsBlock = currentBlocksById['settings:inputs'];

  const textSettings = settingsStateBlock?.text?.text?.split('|');
  let stateMinDiff = settingsInputsBlock
    ? Number(settingsInputsBlock?.elements?.find(element => element.action_id === `${ COMMAND_NAME }:settings:min_diff`)?.initial_option?.value)
    : Number(textSettings?.[0])
  ;
  let stateRegion = textSettings?.[1];  

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
  let updatedBlocks;

  let skipExport; // For regions where it's not supported

  switch (actionName) {
    case 'cancel':
      response = {
        delete_original: 'true',
      };
      break;

    case 'region_select':
      stateRegion = actionValue;
      break;

    default:
      console.warn(`Unknown actionName: ${ actionName }`);
      break;
  }

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