const { HOSTED } = require('../constants');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');
const { respond, logDeep, customAxios, askQuestion, arrayToObj, parseBoolean, camelToReadable } = require('../utils');
const { slackArrayToTableBlock } = require('../slack/slack.utils');
const { collabsInventoryReview } = require('../collabs/collabsInventoryReview');
const { collabsInventorySync } = require('../collabs/collabsInventorySync');
const { googlesheetsSpreadsheetSheetAdd } = require('../googlesheets/googlesheetsSpreadsheetSheetAdd');
const { REGIONS_WF } = require('../constants');

const COMMAND_NAME = 'stock_check';

const DEFAULT_CONFIG = {
  onlyPublishedProducts: true,
  minDiff: 3,
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
    state: (onlyPublishedProducts, minDiff, { region } = {}) => {
      return {
        type: 'section',
        block_id: 'settings:state',
        text: {
          type: 'mrkdwn',
          text: [
            onlyPublishedProducts,
            minDiff,
            ...region ? [region] : [],
          ].join('|'),
        },
      };
    },
    inputs: (onlyPublishedProducts, minDiff) => {
      return {
        type: 'actions',
        block_id: 'settings:inputs',
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
            ...onlyPublishedProducts ? { initial_options: [
              {
                text: {
                  type: 'plain_text',
                  text: 'Only published products',
                },
                value: 'only_published',
              },
            ] } : {},
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

  use_export: (region) => {

    const inputBlock = {
      type: 'input',
      block_id: 'use_export:input',
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:export_name`,
      },
      label: {
        type: 'plain_text',
        text: 'Sheet name',
      },
    };

    const buttonsBlock = {
      type: 'actions',  
      block_id: 'use_export:buttons',
      elements: [
        // {
        //   type: 'button',
        //   text: {
        //     type: 'plain_text',
        //     text: 'Skip',
        //   },
        //   value: 'skip',
        //   action_id: `${ COMMAND_NAME }:use_export:skip`,
        // },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Use Export',
          },
          value: 'use',
          action_id: `${ COMMAND_NAME }:use_export:use`,
        },
      ],
    };

    let instructionsText;

    if (region === 'us') {
      instructionsText = `Hey, so US doesn't work very well :pleading_face: so we're going to use a manual export. Go <https://fasttrack.radial.com/en/wms/report/available-to-promise|here> and click "Export as Excel" in the bottom right. Then, upload <https://docs.google.com/spreadsheets/d/${ spreadsheetHandleToSpreadsheetId['foxtron_stock_check'] }/edit|here>, copy the sheet name, and paste below.`;
    }

    if (region === 'uk') {
      instructionsText = `Go <https://apex.bleckmann.com/ords/r/bleckmann/jumpstart_dashboard/login|here> > Inventory > set "Export Client" > click "Export inventory". Once you have the export in your email, upload it <https://docs.google.com/spreadsheets/d/${ spreadsheetHandleToSpreadsheetId['foxtron_stock_check'] }/edit|here>, copy the sheet name, and paste below.`
    }

    if (!instructionsText) {
      throw new Error(`No instructions`);
    }

    const instructionsBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: instructionsText,
      },
    };

    return [
      instructionsBlock,
      inputBlock,
      buttonsBlock,
    ];
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

  metadata: (metadata) => {

    const {
      count,
      biggestDiff,
      oversellRiskCount,
      timeTaken,
    } = metadata;

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Metadata*:\n${ Object.entries(metadata).map(([prop, value]) => `${ camelToReadable(prop) }: ${ value }`).join('\n') }`,
      },
    };
  },

  sample_display: (title, samples) => {
    // TODO: Add title
    return slackArrayToTableBlock(samples);
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
          text: [
            `You can do a *Full* or *Safe* import, or just fix *Overs*.`,
            `*Full* will fetch all inventory matching your settings again, and import it.`,
            `*Safe* will import only products where importing is unlikely to cause an oversell - ie. Shopify has more than the WMS, or, there is no stock in Shopify (restocks).`,
            `Select your import type to kick it off, or, Cancel.`,
          ].join('\n\n'),
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
              text: 'Overs',
            },
            value: 'overs',
            action_id: `${ COMMAND_NAME }:import:overs`,
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
      divider: {
        type: 'divider',
      },
      listSkus: {
        type: 'actions',
        block_id: 'import:expanded:list_skus',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'List of SKUs',
            },
            value: 'list_skus',
            action_id: `${ COMMAND_NAME }:import:list_skus`,
          },
        ],
      },
    },
  },

  import_skus: {
    input: {
      type: 'input',
      block_id: 'import_skus:input',
      element: {
        type: 'plain_text_input',
        multiline: true,
        action_id: `${ COMMAND_NAME }:import_skus:input`,
      },
      label: {
        type: 'plain_text',
        text: 'List of SKUs, one per line',
      },
    },
    buttons: {
      type: 'actions',
      block_id: 'import_skus:buttons',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Cancel',
          },
          action_id: `${ COMMAND_NAME }:import_skus:cancel`,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Submit',
          },
          action_id: `${ COMMAND_NAME }:import_skus:submit`,
        },
      ],
    },
  },

};

const slackInteractiveStockCheck = async (req, res) => {
  console.log('slackInteractiveStockCheck');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    const { user_id: userId } = body;

    const initialBlocks = [
      blocks.intro,
      blocks.settings.heading,
      blocks.settings.state(DEFAULT_CONFIG.onlyPublishedProducts, DEFAULT_CONFIG.minDiff),
      blocks.settings.inputs(DEFAULT_CONFIG.onlyPublishedProducts, DEFAULT_CONFIG.minDiff),
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
  console.log(`Received payload - handling as interactive step`);

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
  const currentBlocksById = arrayToObj(currentBlocks, { uniqueKeyProp: 'block_id' });

  const settingsStateBlock = currentBlocksById['settings:state'];
  const settingsInputsBlock = currentBlocksById['settings:inputs'];
  
  // current settings - will be overwritten if changed in payload
  const textSettings = settingsStateBlock?.text?.text?.split('|');
  let stateOnlyPublishedProducts = settingsInputsBlock
    ? (settingsInputsBlock?.elements?.find(element => element.action_id === `${ COMMAND_NAME }:settings:only_published`)?.initial_options?.length > 0 ?? false)
    : parseBoolean(textSettings?.[0])
  ;
  let stateMinDiff = settingsInputsBlock
    ? Number(settingsInputsBlock?.elements?.find(element => element.action_id === `${ COMMAND_NAME }:settings:min_diff`)?.initial_option?.value)
    : Number(textSettings?.[1])
  ;
  let stateRegion = textSettings?.[2];

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

      const exportRequiredRegions = ['us'];
      if (exportRequiredRegions.includes(stateRegion)) {
        response = {
          replace_original: 'true',
          blocks: [
            blocks.settings.state(stateOnlyPublishedProducts, stateMinDiff, { region: stateRegion }),
            ...blocks.use_export(stateRegion),
            blocks.cancel,
          ],
        };
        break;
      }

      skipExport = true;
      // Proceed to 'use_export' case

    case 'use_export':
      
      let sheetName;
      
      if (!skipExport) {
        switch (actionNodes?.[0]) {
          case 'skip':
            break;
            
          case 'use':
            sheetName = state?.values?.['use_export:input']?.[`${ COMMAND_NAME }:export_name`]?.value;
            break;
  
          default:
            console.warn(`Unknown actionNode: ${ actionNodes?.[0] }`);
            return;
        }
      }

      const minDiff = stateMinDiff;
      const onlyPublishedProducts = stateOnlyPublishedProducts;
      const region = stateRegion;

      const regionDisplay = region.toUpperCase();

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
      const inventoryReviewResponse = await collabsInventoryReview(region, {
        shopifyVariantsFetchQueries: [
          ...onlyPublishedProducts ? [
            'published_status:published',
            'product_publication_status:approved',
          ] : [],
          ...region === 'us' ? ['tag_not:not_for_radial'] : [],
        ],
        minReportableDiff: minDiff,
        ...sheetName ? {
          exportSheetIdentifier: {
            spreadsheetIdentifier: {
              spreadsheetHandle: 'foxtron_stock_check',
            },
            sheetIdentifier: {
              sheetName,
            },
          },
        } : {},
      });
      console.log('inventoryReviewResponse received');

      const { 
        success: inventoryReviewSuccess,
        result: inventoryReviewResult,
      } = inventoryReviewResponse;
      console.log('inventoryReviewSuccess', inventoryReviewSuccess);

      if (!inventoryReviewSuccess) {
        response = {
          replace_original: 'true',
          text: `${ callerUserId ? `<@${ callerUserId }>, ` : '' }Error checking ${ regionDisplay } stock: ${ JSON.stringify(inventoryReviewResponse) }\n\nJohnnnn :pleading_face:`,
        };
        break;
      }

      const {
        object,
        array: inventoryReviewArray,
        metadata,
        samples,
      } = inventoryReviewResult;

      // console.log('minDiff', minDiff, config);

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
      logDeep('sheetAddResponse', sheetAddResponse);

      const {
        success: sheetAddSuccess,
        result: sheetAddResult,
      } = sheetAddResponse;

      // TODO: Provide a CSV file if sheet add fails
      if (!sheetAddSuccess) {
        response = {
          replace_original: 'true',
          text: `${ callerUserId ? `<@${ callerUserId }>, ` : '' }Error adding sheet to spreadsheet: ${ JSON.stringify(sheetAddResponse) }`,
        };
        break;
      }

      const  {
        sheetUrl,
      } = sheetAddResult;

      response = {
        replace_original: 'true',
        blocks: [
          blocks.result(regionDisplay, sheetUrl, { mentionUserId: callerUserId }),
          ...metadata ? [blocks.metadata(metadata)] : [],
          // Note: only one table is allowed per message.
          // Notes: Currently not working.
          /*
          ...samples ? (
            samples?.oversellRisk
              ? [slackArrayToTableBlock(samples.oversellRisk)] 
              : [slackArrayToTableBlock(...Object.entries(samples)[0])]
           ) : [],
          */
          blocks.settings.state(onlyPublishedProducts, minDiff, { region }),
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
          stateOnlyPublishedProducts = selected;
          break;
          
        case 'min_diff':
          const selectedValue = action?.selected_option?.value;
          stateMinDiff = Number(selectedValue);
          break;

        default:
          console.warn(`Unknown actionNode: ${ actionNodes?.[0] }`);
      }

      updatedBlocks = currentBlocks.map(block => {
        switch (block.block_id) {
          case 'settings:inputs':
            return blocks.settings.inputs(stateOnlyPublishedProducts, stateMinDiff);
          case 'settings:state':
            return blocks.settings.state(stateOnlyPublishedProducts, stateMinDiff);
          default:
            return block;
        }
      });

      response = {
        replace_original: 'true',
        blocks: updatedBlocks,
      };

      break;

    case 'import':

      const isImportExpandBlock = block => block.block_id === 'import:offer';
      const isImportExpandedTextBlock = block => block.block_id === 'import:expanded:text';
      const isImportExpandedButtonsBlock = block => block.block_id === 'import:expanded:buttons';
      const isImportExpandedListSkusBlock = block => block.block_id === 'import:expanded:list_skus';

      updatedBlocks = [];

      switch (actionNodes?.[0]) {
        case 'expand':
          
          // Find and replace the import.offer block with expanded blocks
          for (const block of currentBlocks) {
            if (isImportExpandBlock(block)) {
              updatedBlocks.push(...[
                blocks.import.expanded.text,
                blocks.import.expanded.buttons,
                blocks.import.expanded.divider,
                blocks.import.expanded.listSkus,
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

            if (block.type === 'divider') {
              continue;
            }

            if (isImportExpandedListSkusBlock(block)) {
              continue;
            }

            updatedBlocks.push(block);
          }
          
          response = {
            replace_original: 'true',
            blocks: updatedBlocks,
          };
          break;

        case 'full':
        case 'safe':
        case 'overs':

          const settingsStateBlock = currentBlocksById['settings:state'];

          const settingsFromState = (text) => {
            const textParts = text.split('|');
            let [onlyPublished, minDiff, region] = textParts;
            return {
              onlyPublished: parseBoolean(onlyPublished),
              minDiff: Number(minDiff),
              region,
            };
          };

          const { onlyPublished, minDiff, region } = settingsFromState(settingsStateBlock?.text?.text);

          // await askQuestion(`${ actionNodes?.[0] } inventory sync, ${ onlyPublished ? 'only published products' : 'all products' }, ${ minDiff === 0 ? 'any diff' : `>= ${ minDiff } diff` }?`);
    
          // Send the loading message first
          await customAxios(responseUrl, {
            method: 'post',
            body: {
              replace_original: 'true',
              text: `Importing ${ region.toUpperCase() } stock...`,
            },
          });

          const inventorySyncResponse = await collabsInventorySync(region, {
            minDiff: minDiff,
            mode: actionNodes?.[0],
            shopifyVariantsFetchQueries: [
              ...onlyPublished ? [
                'published_status:published',
                'product_publication_status:approved',
              ] : [],
              ...region === 'us' ? ['tag_not:not_for_radial'] : [],
            ],
          });

          console.log('inventorySyncResponse received');

          const { success: inventorySyncSuccess, result: inventorySyncResult } = inventorySyncResponse;
          if (!inventorySyncSuccess) {
            response = {
              replace_original: 'true',
              text: `${ callerUserId ? `<@${ callerUserId }>, ` : '' }Error syncing inventory: ${ JSON.stringify(inventorySyncResponse) }`,
            };
            break;
          }

          response = {
            replace_original: 'true',
            text: `${ callerUserId ? `Hey <@${ callerUserId }>! ` : '' }${ region.toUpperCase() } stock synced successfully :heart_hands:`,
          };
          break;

        case 'list_skus':
          updatedBlocks = [];
          for (const block of currentBlocks) {
            if (block.block_id.startsWith('import:expanded')) {
              continue;
            }
            updatedBlocks.push(block);
          }

          updatedBlocks.push(...[
            blocks.import_skus.input,
            blocks.import_skus.buttons,
          ]);
          
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

    case 'import_skus':
      switch (actionNodes?.[0]) {
        case 'cancel':
          
          updatedBlocks = [];
          for (const block of currentBlocks) {
            if (block.block_id.startsWith('import_skus')) {
              continue;
            }
            updatedBlocks.push(block);
          }

          updatedBlocks.push(blocks.import.offer);

          logDeep('updatedBlocks', updatedBlocks);

          response = {
            replace_original: 'true',
            blocks: updatedBlocks,
          };
          
          break;

        case 'submit':

          logDeep(state);
          return;
          
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