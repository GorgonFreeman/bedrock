const { HOSTED } = require('../constants');
const { respond, logDeep, customAxios, askQuestion, arrayToObj, camelToReadable } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { collabsOrderSyncCheck } = require('../collabs/collabsOrderSyncCheck');

// const COMMAND_NAME = 'order_sync_check'; // slash command
const COMMAND_NAME = 'dev__order_sync_check'; // dev slash command for testing

const blocks = {
  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Order Sync Check`,
    },
  },
  confirm: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Check order sync for all regions?`,
    },
  },
  buttons: {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Confirm',
        },
        value: 'confirm',
        action_id: `${ COMMAND_NAME }:confirm`,
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
      text: `⏳ Processing order sync check...`,
    },
  },
  cancelled: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Order sync check cancelled.`,
    },
  },
  result: (orderSyncCheckResults) => {
    const resultBlocks = orderSyncCheckResults.map(result => {
      const {
        region,
        success,
      } = result;

      if (!success) {
        return {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${ region.toUpperCase() }: ❌\nError checking order sync for ${ region.toUpperCase() }: ${ result?.error || 'Unknown error' }\n\n`,
          },
        };
      }

      const {
        lastNewOrder,
        lastFulfilledOrder,
      } = result;

      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${ region.toUpperCase() }: ✅\n Latest order synced: <${ lastNewOrder.link }|${ lastNewOrder.name }>\nPlaced at ${ lastNewOrder.createdAtString } ( ${ lastNewOrder.createdAtTimePassedString } )\n\n Latest order fulfilled: <${ lastFulfilledOrder.link }|${ lastFulfilledOrder.name }>\nPlaced at ${ lastFulfilledOrder.createdAtString } ( ${ lastFulfilledOrder.createdAtTimePassedString } )\nProcessed at ${ lastFulfilledOrder.processedAtString } ( ${ lastFulfilledOrder.processedAtTimePassedString } )\n\n`
        },
      };
    });
    logDeep('resultBlocks', resultBlocks);
    return resultBlocks;
  },
};

const slackInteractiveOrderSyncCheck = async (req, res) => {
  console.log('slackInteractiveOrderSyncCheck');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.confirm,
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
    message,
    user,
  } = payload;

  const { id: callerUserId } = user;

  const {
    blocks: currentBlocks,
  } = message;
  const currentBlocksById = arrayToObj(currentBlocks, { uniqueKeyProp: 'block_id' });

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
    case 'confirm':
      // Send the loading message first
      response = {
        replace_original: 'true',
        type: 'section',
        blocks: [
          blocks.loading,
        ],
      }
      await customAxios(responseUrl, {
        method: 'post',
        body: response,
      });

      const orderSyncCheckResults = [];
      for (const region of REGIONS_WF) {
        const orderSyncCheckResponse = await collabsOrderSyncCheck(region);
        const { success: orderSyncCheckSuccess, result: orderSyncCheckResult } = orderSyncCheckResponse;
        if (orderSyncCheckSuccess) {
          orderSyncCheckResults.push({
            region,
            success: true,
            lastNewOrder: orderSyncCheckResult.lastNewOrder,
            lastFulfilledOrder: orderSyncCheckResult.lastFulfilledOrder,
          });
          continue;
        }
        orderSyncCheckResults.push({
          region,
          success: false,
          error: orderSyncCheckResponse?.error?.[0] || 'Error checking order sync',
        });
      }
      
      const result = [
        blocks.intro,
        ...blocks.result(orderSyncCheckResults),
      ];
      response = {
        replace_original: 'true',
        blocks: result,
      };
      break;
    case 'cancel':
      response = {
        replace_original: 'true',
        blocks: [
          blocks.cancelled,
        ],
      };
      break;
    default:
      console.warn(`Unknown actionName: ${ actionName }`);
      return;
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveOrderSyncCheck;