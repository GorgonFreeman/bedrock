const { respond, logDeep, customAxios } = require('../utils');
const { REGIONS_WF } = require('../constants');

const SOURCE_REGION = 'au';

const COMMAND_NAME = 'product_sync'; // slash command

const RECONCILE_PVX_ENDPOINT = 'https://australia-southeast1-foxtware.cloudfunctions.net/apexCatalogueSyncReconsilePvx';
const SYNC_REGIONS_ENDPOINT = 'https://australia-southeast1-foxtware.cloudfunctions.net/apexCatalogueShopifyToShopify';

const blocks = {

  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Product Sync*`,
    },
  },

  sku_input: {
    type: 'input',
    block_id: 'sku_input:sku_list',
    label: {
      type: 'plain_text',
      text: 'SKUs (one per line)',
    },
    optional: false,
    element: {
      type: 'plain_text_input',
      placeholder: {
        type: 'plain_text',
        text: 'Enter SKUs...',
      },
      action_id: `${ COMMAND_NAME }:sku_input`,
    },
  },

  buttons: {
    type: 'actions',
    block_id: 'buttons',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Sync to PVX',
        },
        action_id: `${ COMMAND_NAME }:sync_to_pvx`,
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: `Sync to ${ REGIONS_WF.filter(region => region !== SOURCE_REGION).map(region => region.toUpperCase()).join(', ') }`,
        },
        action_id: `${ COMMAND_NAME }:sync_to_regions`,
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

  result: {

    loading: (message) => {
      return {
      type: 'section',
      block_id: 'result:loading',
      text: {
        type: 'mrkdwn',
          text: message,
        },
      };
    },

  },

};

const slackInteractiveProductSync = async (req, res) => {
  console.log('slackInteractiveProductSync');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      blocks.sku_input,
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

  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  switch (actionName) {

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

module.exports = slackInteractiveProductSync;