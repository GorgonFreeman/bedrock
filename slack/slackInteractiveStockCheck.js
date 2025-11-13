const { respond, logDeep, customAxios } = require('../utils');
const { collabsInventoryReview } = require('../collabs/collabsInventoryReview');
const { googlesheetsSpreadsheetSheetAdd } = require('../googlesheets/googlesheetsSpreadsheetSheetAdd');
const { REGIONS_WF } = require('../constants');

const COMMAND_NAME = 'stock_check';

const DEFAULT_CONFIG = {
  onlyPublishedProducts: true,
  minDiff: 3,
};

let config = Object.fromEntries(Object.entries(DEFAULT_CONFIG));

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
    inputs: {
      type: 'actions',
      elements: [
        {
          type: 'checkboxes',
          action_id: `${ COMMAND_NAME }:settings:only_published`,
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Only published products',
              },
              value: 'only_published',
            },
          ],
          initial_options: config.onlyPublishedProducts ? [
            {
              text: {
                type: 'plain_text',
                text: 'Only published products',
              },
              value: 'only_published',
            },
          ] : [],
        },
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
              text: String(config.minDiff),
            },
            value: String(config.minDiff),
          },
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
  
  result: (regionDisplay, sheetUrl) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Stock check for ${ regionDisplay }: <${ sheetUrl }|:google_sheets:>`,
      },
    };
  },

  import: {
    offer: {
      type: 'actions',
      block_id: 'import:offer',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Import inventory',
          },
          value: 'import:expand',
          action_id: `${ COMMAND_NAME }:import:expand`,
        },
      ],
    },
    expanded: {
      text: {
        type: 'section',
        block_id: 'import:expanded:text',
        text: {
          type: 'mrkdwn',
          text: `You can do a *Full* or *Safe* import.\n\n*Full* will fetch all inventory matching your settings again, and import it.\n\n*Safe* will import only products where importing is unlikely to cause an oversell - ie. Shopify has more than the WMS, or, there is no stock in Shopify (restocks).\n\nSelect your import type to kick it off, or, Cancel.`,
        },
      },
      buttons: {
        type: 'actions',  
        block_id: 'import:expanded:buttons',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Full',
            },
            value: 'full',
            action_id: `${ COMMAND_NAME }:import:full`,
            style: 'danger',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Safe',
            },
            value: 'safe',
            action_id: `${ COMMAND_NAME }:import:safe`,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Cancel',
            },
            value: 'cancel',
            action_id: `${ COMMAND_NAME }:import:cancel`,
            style: 'primary',
          },
        ],
      },
    },
  },
};

const slackInteractiveStockCheck = async (req, res) => {
  console.log('slackInteractiveStockCheck');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    const initialBlocks = [
      blocks.intro,
      blocks.settings.heading,
      blocks.settings.inputs,
      blocks.region_select.heading,
      blocks.region_select.buttons,
    ];

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }

  // Because we got to this point, we have a payload - handle as an interactive step
  console.log(`Received payload - handling as interactive step`);

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

  switch (actionName) {
    case 'region_select':
      const region = actionValue;
      const regionDisplay = region.toUpperCase();

      // Show "Checking [REGION] stock..." message
      response = {
        replace_original: 'true',
        text: `Checking ${ regionDisplay } stock...`,
      };

      // Send the loading message first
      await customAxios(responseUrl, {
        method: 'post',
        body: response,
      });

      // Run the inventory review
      const {
        onlyPublishedProducts,
        minDiff,
      } = config;

      const inventoryReviewResponse = await collabsInventoryReview(region, {
        ...onlyPublishedProducts ? {
          shopifyVariantsFetchQueries: [
            'published_status:published',
            'product_publication_status:approved',
          ],
        } : {},
        minReportableDiff: minDiff,
      });

      const { 
        success: inventoryReviewSuccess,
        result: inventoryReviewResult,
      } = inventoryReviewResponse;

      if (!inventoryReviewSuccess) {
        response = {
          replace_original: 'true',
          text: `Error checking ${ regionDisplay } stock: ${ JSON.stringify(inventoryReviewResponse) }\n\nJohnnnn :pleading_face:`,
        };
        break;
      }

      const {
        object,
        array: inventoryReviewArray,
      } = inventoryReviewResult;

      console.log('minDiff', minDiff, config);

      if (Array.isArray(inventoryReviewArray) && inventoryReviewArray.length === 0) {
        response = {
          replace_original: 'true',
          text: `Huh, it's empty - I guess there are no products on ${ regionDisplay } with less than ${ minDiff } diff.`,
        };
        break;
      }

      const sheetAddResponse = await googlesheetsSpreadsheetSheetAdd(
        {
          spreadsheetHandle: 'foxtron_stock_check',
        }, 
        {
          objArray: inventoryReviewArray,
        },
        {
          sheetName: `${ regionDisplay } ${ Date.now() }`,
        },
      );

      const {
        success: sheetAddSuccess,
        result: sheetAddResult,
      } = sheetAddResponse;

      // TODO: Provide a CSV file if sheet add fails
      if (!sheetAddSuccess) {
        response = {
          replace_original: 'true',
          text: `Error adding sheet to spreadsheet: ${ JSON.stringify(sheetAddResponse) }`,
        };
        break;
      }

      const  {
        sheetUrl,
      } = sheetAddResult;

      response = {
        replace_original: 'true',
        blocks: [
          blocks.result(regionDisplay, sheetUrl),
          // TODO: Summarise the sheet info in the Slack message, e.g. max diff, whether it's within expected range, etc.
          // TODO: Offer to import inventory
          // TODO: Expire import offer after 5 minutes
          blocks.import.offer,
        ],
      };
      break;

    case 'settings':
      switch (actionNodes?.[0]) {
        case 'only_published':
          const selected = action.selected_options.length !== 0;
          config.onlyPublishedProducts = selected;
          break;
          
        case 'min_diff':
          const selectedValue = action?.selected_option?.value;
          config.minDiff = Number(selectedValue);
          break;

        default:
          console.warn(`Unknown actionNode: ${ actionNodes?.[0] }`);
      }
      return;

    case 'import':

      const isImportExpandBlock = block => block.block_id === 'import:offer';
      const isImportExpandedTextBlock = block => block.block_id === 'import:expanded:text';
      const isImportExpandedButtonsBlock = block => block.block_id === 'import:expanded:buttons';

      const currentBlocks = payload.message?.blocks || [];
      const updatedBlocks = [];

      switch (actionNodes?.[0]) {
        case 'expand':
          
          // Find and replace the import.offer block with expanded blocks
          for (const block of currentBlocks) {
            if (isImportExpandBlock(block)) {
              updatedBlocks.push(...[
                blocks.import.expanded.text,
                blocks.import.expanded.buttons,
              ]);
              continue;
            }
            updatedBlocks.push(block);
          }
          
          response = {
            replace_original: 'true',
            blocks: updatedBlocks,
          };
          break;

        case 'cancel':

          for (const block of currentBlocks) {
            if (isImportExpandedTextBlock(block)) {
              updatedBlocks.push(blocks.import.offer);
              continue;
            }

            if (isImportExpandedButtonsBlock(block)) {
              continue;
            }

            updatedBlocks.push(block);
          }
          
          response = {
            replace_original: 'true',
            blocks: updatedBlocks,
          };
          break;

        default:
          console.warn(`Unknown actionNode: ${ actionNodes?.[0] }`);
          return;
      }
      break;
      
    default:
      console.warn(`Unknown actionId: ${ actionId }`);
      return;
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveStockCheck;