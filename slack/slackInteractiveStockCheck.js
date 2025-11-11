const { respond, logDeep, customAxios } = require('../utils');
const { collabsInventoryReview } = require('../collabs/collabsInventoryReview');
const { googlesheetsSpreadsheetSheetAdd } = require('../googlesheets/googlesheetsSpreadsheetSheetAdd');

const COMMAND_NAME = 'stock_check';

const slackInteractiveStockCheck = async (req, res) => {
  console.log('slackInteractiveStockCheck');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    const initialBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Let's do a stock check! Which store do you want to do?`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'AU',
            },
            value: 'au',
            action_id: `${ COMMAND_NAME }:region_select:au`,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'US',
            },
            value: 'us',
            action_id: `${ COMMAND_NAME }:region_select:us`,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'UK',
            },
            value: 'uk',
            action_id: `${ COMMAND_NAME }:region_select:uk`,
          },
        ],
      },
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

      const sheetAddResponse = await googlesheetsSpreadsheetSheetAdd(
        {
          spreadsheetHandle: 'foxtron_stock_check',
        }, 
        {
          objArray: inventoryReviewResult,
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
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Stock check for ${ regionDisplay }: <${ sheetUrl }|sheet>`,
            },
          },
          // TODO: Summarise the sheet info in the Slack message, e.g. max diff, whether it's within expected range, etc.
        ],
      };
      break;
      
    default:
      throw new Error(`Unknown actionId: ${ actionId }`);
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveStockCheck;