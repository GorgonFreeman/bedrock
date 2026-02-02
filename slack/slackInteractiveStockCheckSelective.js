const { HOSTED } = require('../constants');
const { respond, logDeep, customAxios, arrayToObj } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { collabsInventoryReview } = require('../collabs/collabsInventoryReview');

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
        text: '*Settings*',
      },
    },
    state: ({ region } = {}) => {
      return {
        type: 'section',
        block_id: 'settings:state',
        text: {
          type: 'mrkdwn',
          text: [
            ...region ? [region] : [],
          ].join('|'),
        },
      };
    },
  },

  sku_input: {
    heading: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Enter SKUs to check*',
      },
    },
    textfield: {
      type: 'input',
      block_id: 'sku_input:textfield',
      element: {  
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:sku_input:textfield`,
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: 'List of SKUs, one per line',
        },
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

  result: (region, stockCheckArray, { mentionUserId } = {}) => {
    const stockCheckRows = stockCheckArray.map(item => `${ item.sku } | Shopify: ${ item.shopifyQty } | WMS: ${ item.wmsQty } | Diff: ${ item.absDiff }` ).join('\n');
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ mentionUserId ? `Hey <@${ mentionUserId }>! ` : '' }Stock check for ${ region.toUpperCase() }\n\n${ stockCheckRows }`,
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
      blocks.region_select.heading,
      blocks.region_select.buttons,
      blocks.cancel,
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
    message,
    user,
  } = payload;

  const { id: callerUserId } = user;

  const {
    blocks: currentBlocks,
  } = message;
  const currentBlocksById = arrayToObj(currentBlocks, { keyProp: 'block_id' });

  const settingsStateBlock = currentBlocksById['settings:state'];
  const textSettings = settingsStateBlock?.text?.text?.split('|');

  let stateRegion = textSettings?.[0];

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

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.settings.state({ region: stateRegion }),
          blocks.sku_input.heading,
          blocks.sku_input.textfield,
          blocks.sku_input.buttons,
        ],
      };
      break;

    case 'sku_input':
      switch (actionNodes?.[0]) {
        case 'cancel':
          response = {
            delete_original: 'true',
          };
          break;

        case 'submit':

          const textfieldValue = state?.values?.['sku_input:textfield']?.[`${ COMMAND_NAME }:sku_input:textfield`]?.value;
          const skus = textfieldValue?.split('\n').map(sku => sku.trim()) || [];

          if (skus && skus.length === 0) {
            response = {
              replace_original: 'true',
              text: 'No SKUs provided. Please try again.',
            };
            break;
          }

          response = {
            replace_original: 'true',
            text: `Checking ${ stateRegion.toUpperCase() } stock for ${ skus.length } SKUs...`,
          };

          await customAxios(responseUrl, {
            method: 'post',
            body: response,
          });

          console.log('skus', skus);

          // Run the inventory check
          const inventoryReviewResponse = await collabsInventoryReview(stateRegion, {
            skus,
            shopifyVariantsFetchQueries: [
              'published_status:published',
              'product_publication_status:approved',
              ...VARIANT_FETCH_QUERIES_BY_STORE[stateRegion] || [],
            ],
          });
          const {
            success: inventoryReviewSuccess,
            result: inventoryReviewResult,
          } = inventoryReviewResponse;
          if (!inventoryReviewSuccess) {
            response = {
              replace_original: 'true',
              text: `${ callerUserId ? `<@${ callerUserId }>, ` : '' }Error checking ${ stateRegion.toUpperCase() } stock`,
            };
            break;
          }

          const {
            array: inventoryReviewArray,
          } = inventoryReviewResult;

          response = {
            replace_original: 'true',
            blocks: [
              blocks.result(stateRegion, inventoryReviewArray, { mentionUserId: callerUserId }),
            ],
          };
          break;

        default:
          console.warn(`Unknown actionNode: ${ actionNodes?.[0] }`);
          break;
      }
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

module.exports = slackInteractiveStockCheckSelective;