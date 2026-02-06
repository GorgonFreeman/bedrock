const { respond, logDeep, customAxios } = require('../utils');
const { collabsProductDataCheck } = require('../collabs/collabsProductDataCheck');
const { shopifyProductsGet } = require('../shopify/shopifyProductsGet');

const DEFAULT_REGION = 'au';

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

    select: {
      type: 'section',
      block_id: 'sku_input:select',
      text: {
        type: 'mrkdwn',
        text: '*Select SKU to check*',
      },
      accessory: {
        type: 'external_select',
        action_id: `${ COMMAND_NAME }:sku_input:select`,
        placeholder: {
          type: 'plain_text',
          text: 'Type and search a SKU..',
        },
        min_query_length: 1,
        action_id: `${ COMMAND_NAME }:sku_input:select`,
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
      blocks.sku_input.select,
      blocks.sku_input.buttons,
    ];

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }

  const payload = JSON.parse(body.payload);
  logDeep('payload', payload);
  const { type } = payload;

  if (type === 'block_suggestion') {
    const { value: payloadValue } = payload;

    const shopifyProductsResponse = await shopifyProductsGet(DEFAULT_REGION, {
      queries: [`sku:${ payloadValue }*`],
      attrs: `id title handle exampleVariant: variants (first: 1 sortKey: SKU, reverse: true) { edges { node { sku } } }`,
      limit: 100,
    });

    const { success: shopifyProductsSuccess, result: shopifyProductCandidates } = shopifyProductsResponse;
    if (!shopifyProductsSuccess) {
      console.error('Error finding SKUs', shopifyProductsResponse);
      return;
    }

    const optionValues = new Set();
    shopifyProductCandidates.forEach(product => {
      const {
        exampleVariant,
      } = product;

      const sizeGroupings = [
        '-3XS/XXS',
        '-XXS/XS',
        '-XS/S',
        '-S/M',
        '-M/L',
        '-L/XL',
        '-XL/XXL',
        '-XXL/3XL',
        '-3XS',
        '-XXS',
        '-XS',
        '-S',
        '-M',
        '-L',
        '-XL',
        '-XXL',
        '-3XL',
        '-O/S',
      ];
      const sizeGroupingRegex = new RegExp(`(${ sizeGroupings.join('|') })`, 'i');
      const partialSKU = exampleVariant?.[0]?.sku.replace(sizeGroupingRegex, '');
      optionValues.add(partialSKU);
    });

    const options = Array.from(optionValues).map(value => {
      return {
        text: {
          type: 'plain_text',
          text: value,
        },
        value,
      };
    });

    return respond(res, 200, { options });
  }

  // Because we got to this point, we have a payload - handle as an interactive step
  respond(res, 200); // Acknowledge immediately - we'll provide the next step to the response_url later

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
          const selectedOptionValue = state?.values?.['sku_input:select']?.[`${ COMMAND_NAME }:sku_input:select`]?.selected_option?.value;
          const sku = selectedOptionValue ? selectedOptionValue.trim() : '';

          if (!sku) {
            response = {
              replace_original: 'true',
              blocks: [
                blocks.intro,
                blocks.sku_input.select,
                blocks.sku_input.errorDisplay('Please select a SKU'),
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