const { respond, logDeep, customAxios } = require('../utils');
const { collabsInventoryReview } = require('../collabs/collabsInventoryReview');
const { googlesheetsSpreadsheetSheetAdd } = require('../googlesheets/googlesheetsSpreadsheetSheetAdd');
const { REGIONS_WF } = require('../constants');

const COMMAND_NAME = 'stock_check';

const blocks = {
  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Let's do a stock check! Which store do you want to do?`,
    },
  },

  region_select: {
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

  settings: {
    closed: {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Settings :gear:',
          },
          value: 'settings:open',
          action_id: `${ COMMAND_NAME }:settings:open`,
        },
      ],
    },
    open: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Settings*',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'checkboxes',
            options: [
              {
                text: {
                  type: 'plain_text',
                  text: 'Only live products',
                },
                value: 'only_live',
              },
            ],
            initial_options: [
              {
                text: {
                  type: 'plain_text',
                  text: 'Only live products',
                },
                value: 'only_live',
              },
            ],
            action_id: `${ COMMAND_NAME }:settings:only_live`,
          },
          {
            type: 'static_select',
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
                text: '3',
              },
              value: '3',
            },
            action_id: `${ COMMAND_NAME }:settings:min_diff`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Cancel',
            },
            value: 'settings:close',
            action_id: `${ COMMAND_NAME }:settings:close`,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Save',
            },
            value: 'settings:save',
            action_id: `${ COMMAND_NAME }:settings:save`,
          },
        ],
      },
    ],

  },
  result: (regionDisplay, sheetUrl) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Stock check for ${ regionDisplay }: <${ sheetUrl }|sheet>`,
      },
    };
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
      blocks.region_select,
      blocks.settings.closed,
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
      const inventoryReviewResponse = await collabsInventoryReview(region);

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
        ],
      };
      break;

    case 'settings':
      switch (actionNodes?.[0]) {
        case 'open':
          response = {
            replace_original: 'true',
            blocks: [
              blocks.intro,
              blocks.region_select,
              ...blocks.settings.open,
            ],
          };
          break;
        case 'close':
          response = {
            replace_original: 'true',
            blocks: [
              blocks.intro,
              blocks.region_select,
              blocks.settings.closed,
            ],
          };
          break;
        case 'save':
          // TODO: Process settings changes and alter a global config
          response = {
            replace_original: 'true',
            blocks: [
              blocks.intro,
              blocks.region_select,
              blocks.settings.closed,
            ],
          };
          break;
        default:
          console.warn(`Unknown actionNodes[0]: ${ actionNodes?.[0] }`);
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