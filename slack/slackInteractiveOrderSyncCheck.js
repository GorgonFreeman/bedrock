const { HOSTED } = require('../constants');
const { respond, logDeep, customAxios, askQuestion, arrayToObj, camelToReadable } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { collabsOrderSyncCheck } = require('../collabs/collabsOrderSyncCheck');

const COMMAND_NAME = 'order_sync_check'; // slash command
// const COMMAND_NAME = 'dev__order_sync_check'; // dev slash command for testing

const blocks = {
  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Let's do an order sync check!`,
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
  result: (regionDisplay, orderSyncCheckResult, { mentionUserId } = {}) => {
    const {
      lastNewOrder,
      lastFulfilledOrder,
    } = orderSyncCheckResult;

    const resultText = `${ mentionUserId ? `Hey <@${ mentionUserId }>! ` : '' }Order sync check for ${ regionDisplay }:`;
    const lastNewOrderText = [
      `Last new order: <${ lastNewOrder.link }|${ lastNewOrder.name }>`,
      `- Created at: ${ lastNewOrder.createdAtString }`,
    ].join('\n');
    const lastFulfilledOrderText = [
      `Last fulfilled order: <${ lastFulfilledOrder.link }|${ lastFulfilledOrder.name }>`,
      `- Created at: ${ lastFulfilledOrder.createdAtString }`,
      `- Processed at: ${ lastFulfilledOrder.processedAtString }`,
    ].join('\n');

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          resultText,
          lastNewOrderText,
          lastFulfilledOrderText,
        ].join('\n'),
      },
    };
  },
};

const slackInteractiveOrderSyncCheck = async (req, res) => {
  console.log('slackInteractiveOrderSyncCheck');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    const initialBlocks = [
      blocks.intro,
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
  let updatedBlocks;

  switch (actionName) {
    case 'region_select':

      const region = actionValue;
      const regionDisplay = region.toUpperCase();

      console.log('region', region, regionDisplay);

      // Show "Checking [REGION] order sync..." message
      response = {
        replace_original: 'true',
        text: `Checking ${ regionDisplay } order sync... :mag:`,
      };

      // Send the loading message first
      await customAxios(responseUrl, {
        method: 'post',
        body: response,
      });

      // Run the order sync check
      const orderSyncCheckResponse = await collabsOrderSyncCheck(region);
      const { success: orderSyncCheckSuccess, result: orderSyncCheckResult } = orderSyncCheckResponse;

      if (!orderSyncCheckSuccess) {
        response = {
          replace_original: 'true',
          text: `${ callerUserId ? `<@${ callerUserId }>, ` : '' }Error checking ${ regionDisplay } order sync: ${ JSON.stringify(orderSyncCheckResponse) }`,
        };
        break;
      }

      // Show the result
      response = {
        replace_original: 'true',
        blocks: [
          blocks.result(regionDisplay, orderSyncCheckResult, { mentionUserId: callerUserId }),
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