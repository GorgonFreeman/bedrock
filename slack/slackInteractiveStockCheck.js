const { respond, logDeep, customAxios } = require('../utils');
const { collabsInventoryReview } = require('../collabs/collabsInventoryReview');

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

  let response;

  switch (actionId) {
    case `${ COMMAND_NAME }:region_select`:
      const region = actionValue.toLowerCase();
      const regionUpper = region.toUpperCase();

      // Show "Checking [REGION] stock..." message
      response = {
        replace_original: 'true',
        text: `Checking ${ regionUpper } stock...`,
      };

      // Send the loading message first
      await customAxios(responseUrl, {
        method: 'post',
        body: response,
      });

      // Run the inventory review
      const inventoryResult = await collabsInventoryReview(region);

      // Format the results
      let resultText = `Stock check for ${ regionUpper }:\n\n`;

      if (!inventoryResult.success) {
        resultText += `❌ Error: ${ inventoryResult.message || inventoryResult.error || 'Unknown error' }`;
      } else {
        const inventoryData = inventoryResult.result;
        const skus = Object.keys(inventoryData);
        const totalSkus = skus.length;

        resultText += `✅ Completed! Reviewed ${ totalSkus } SKUs.\n\n`;

        // Show summary statistics
        let itemsWithDiff = 0;
        let itemsWithOversellRisk = 0;

        for (const sku of skus) {
          const item = inventoryData[sku];
          const diffProp = Object.keys(item).find(key => key.toLowerCase().includes('diff'));
          const oversellRiskProp = Object.keys(item).find(key => key.toLowerCase().includes('oversellrisk'));

          if (diffProp && item[diffProp] > 0) {
            itemsWithDiff++;
          }
          if (oversellRiskProp && item[oversellRiskProp]) {
            itemsWithOversellRisk++;
          }
        }

        resultText += `📊 Summary:\n`;
        resultText += `• Items with differences: ${ itemsWithDiff }\n`;
        resultText += `• Items with oversell risk: ${ itemsWithOversellRisk }\n`;

        // Show top 10 items with differences (if any)
        if (itemsWithDiff > 0) {
          const itemsArray = skus.map(sku => ({
            sku,
            ...inventoryData[sku],
          }));

          const diffProp = Object.keys(itemsArray[0]).find(key => key.toLowerCase().includes('diff'));
          const oversellRiskProp = Object.keys(itemsArray[0]).find(key => key.toLowerCase().includes('oversellrisk'));

          itemsArray.sort((a, b) => {
            if (a[oversellRiskProp] && !b[oversellRiskProp]) return -1;
            if (!a[oversellRiskProp] && b[oversellRiskProp]) return 1;
            return (b[diffProp] || 0) - (a[diffProp] || 0);
          });

          const topItems = itemsArray.slice(0, 10).filter(item => item[diffProp] > 0);

          if (topItems.length > 0) {
            resultText += `\n🔍 Top items with differences:\n`;
            for (const item of topItems) {
              const shopifyQty = item.shopifyAvailable || 0;
              const wmsQty = item.logiwaSellable || item.pvxAvailable || item.bleckmannAvailable || 0;
              const diff = item[diffProp];
              const risk = item[oversellRiskProp] ? '⚠️' : '';
              resultText += `• ${ item.sku }: Shopify ${ shopifyQty } vs WMS ${ wmsQty } (diff: ${ diff }) ${ risk }\n`;
            }
          }
        }
      }

      response = {
        replace_original: 'true',
        text: resultText,
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