const { respond, logDeep, customAxios } = require('../utils');
const { collabsProductDataCheck } = require('../collabs/collabsProductDataCheck');

const COMMAND_NAME = 'dev__product_data_check'; // slash command

const blocks = {
  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Let's check product data!`,
    },
  },

  sku_input: {
    heading: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Enter SKU to check*',
      },
    },
    errorDisplay: (errorMessage) => {
      return {
        type: 'section',
        block_id: 'sku_input:error',
        text: {
          type: 'mrkdwn',
          text: `:warning: ${ errorMessage }`,
        },
      };
    },
    textfield: {
      type: 'input',
      block_id: 'sku_input:textfield',
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:sku_input:textfield`,
        multiline: false,
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

  result: (sku, productDataCheckResult, mentionUserId) => {
    const styleArcadeData = productDataCheckResult.stylearcadeData;
    const shopifyData = productDataCheckResult.shopifyData;
    const styleArcadeDataRows = [
      `StyleArcade Data:`,
      `${ !styleArcadeData.weight ? ':warning: ' : '' } Weight: ${ !styleArcadeData.weight ? 'Not set' : `${ styleArcadeData.weight } kg` }`,
      `${ !styleArcadeData.dimensions ? ':warning: ' : '' } Dimensions: ${ !styleArcadeData.dimensions ? 'Not set' : `${ styleArcadeData.dimensions } cm` }`,
    ].join('\n');
    const shopifyDataRows = Object.entries(shopifyData).map(([region, data]) => {
      return [
        `Shopify ${ region.toUpperCase() }:`,
        `${ !data.dimensionsCm ? ':warning: ' : '' } Dimensions (cm): ${ data.dimensionsCm || 'Not set' }`,
        `${ !data.dimensionsInches ? ':warning: ' : '' } Dimensions (inches): ${ data.dimensionsInches || 'Not set' }`,
        `${ !data.weightKg ? ':warning: ' : '' } Weight (kg): ${ data.weightKg || 'Not set' }`,
        `${ !data.weightPounds ? ':warning: ' : '' } Weight (pounds): ${ data.weightPounds || 'Not set' }`,
      ].join('\n');
    }).join('\n\n');
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `${ mentionUserId ? `Hey <@${ mentionUserId }>! ` : '' } Product Data check for SKU ${ sku }:`,
          ...styleArcadeDataRows.length ? [styleArcadeDataRows] : [],
          ...shopifyDataRows.length ? [shopifyDataRows] : [],
        ].join('\n\n'),
      },
    };
  },

  cancel: {
    type: 'actions',
    block_id: 'cancel',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Submit',
        },
        action_id: `${ COMMAND_NAME }:sku_input:submit`,
      },
    ],
  },
}

const slackInteractiveProductDataCheck = async (req, res) => {

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      blocks.sku_input.heading,
      blocks.sku_input.textfield,
      blocks.sku_input.buttons,
    ];

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }

  // Because we got to this point, we have a payload - handle as an interactive step
  respond(res, 200); // Acknowledge immediately - we'll provide the next step to the response_url later

  const payload = JSON.parse(body.payload);

  const { 
    response_url: responseUrl,
    state, 
    actions, 
    user,
  } = payload;

  const { id: callerUserId } = user;

  const action = actions?.[0];
  const { 
    action_id: actionId,
    value: actionValue,
  } = action;

  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  logDeep({
    responseUrl,
    state,
    actionId,
    actionValue,
  });

  let response;

  switch (actionName) {

    case 'sku_input':
      switch (actionNodes?.[0]) {

        case 'submit':
          const textFieldValue = state?.values?.['sku_input:textfield']?.[`${ COMMAND_NAME }:sku_input:textfield`]?.value;
          const sku = textFieldValue?.trim();
          
          if (!sku) {
            response = {
              replace_original: 'true',
              blocks: [
                blocks.intro,
                blocks.sku_input.heading,
                blocks.sku_input.errorDisplay('Please enter a valid SKU'),
                blocks.sku_input.textfield,
                blocks.sku_input.buttons,
              ],
            };
            break;
          }

          response = {
            replace_original: 'true',
            text: `Checking product data for SKU: ${ sku }...`,
          };

          await customAxios(responseUrl, {
            method: 'post',
            body: response,
          });

          const productDataCheckResponse = await collabsProductDataCheck(sku);
          const {
            success: productDataCheckSuccess,
            result: productDataCheckResult,
          } = productDataCheckResponse;

          if (!productDataCheckSuccess) {
            response = {
              replace_original: 'true',
              text: `Error checking product data for SKU: ${ sku }`,
            };
            break;
          }

          response = {
            replace_original: 'true',
            blocks: [
              blocks.result(sku, productDataCheckResult.object, callerUserId),
            ],
          }

          break;

        case 'cancel':
          response = {
            delete_original: 'true',
          };
          break;

        default:
          console.warn(`Unknown actionNode: ${ actionNodes?.[0] }`);
          break;
      }
      break;

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

module.exports = slackInteractiveProductDataCheck;