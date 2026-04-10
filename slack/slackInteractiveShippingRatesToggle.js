const { respond, logDeep, customAxios, arrayToObj, gidToId } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');

const COMMAND_NAME = 'shipping_rates_toggle'; // slash command

const blocks = {

  intro: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Shipping Rates Toggle*',
    },
  },

  region_select: {
    intro: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Select a region:',
      },
    },

    ask: {
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

    context: (region) => {
      return {
        type: 'section',
        block_id: 'region_select:context',
        text: {
          type: 'mrkdwn',
          text: `Selected region: ${ region }`,
        },
      };
    },
  },

  rates_select: {

    ask: {
      type: 'section',
      block_id: 'rates_select:ask',
      text: {
        type: 'mrkdwn',
        text: 'Type and select rates to toggle:',
      },
      accessory: {
        type: 'external_select',
        placeholder: {
          type: 'plain_text',
          text: 'Type and search a rate..',
        },
        min_query_length: 1,
        action_id: `${ COMMAND_NAME }:rates_select`,
      },
    },

    context: (targettedRates) => {
      return {
        type: 'section',
        block_id: 'rates_select:context',
        text: {
          type: 'mrkdwn',
          text: `Targeted rates:\n${ targettedRates.length > 0 ? targettedRates.map(r => `- ${ r.name }`).join('\n') : 'None' }`,
        },
      };
    },
  },

  action_buttons: {
    type: 'actions',
    block_id: 'action_buttons',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Enable',
        },
        action_id: `${ COMMAND_NAME }:action_buttons:enable`,
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Disable',
        },
        action_id: `${ COMMAND_NAME }:action_buttons:disable`,
      },
    ],
  },

  cancel: {
    type: 'actions',
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

};

const slackInteractiveShippingRatesToggle = async (req, res) => {
  console.log('slackInteractiveShippingRatesToggle');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      blocks.region_select.intro,
      blocks.region_select.ask,
      blocks.cancel,
    ];

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }

  const payload = JSON.parse(body.payload);
  logDeep('payload', payload);

  const {
    type,
    message,
  } = payload;

  const {
    blocks: currentBlocks,
  } = message;
  const currentBlocksById = arrayToObj(currentBlocks, { keyProp: 'block_id' });

  if (type === 'block_suggestion') {

    // Get selected region
    const selectedRegion = currentBlocksById['region_select:context']?.text?.text?.split('Selected region: ')?.[1]?.trim();
    logDeep('selectedRegion', selectedRegion);

    // Fetch all delivery profiles
    const deliveryProfileAttrs = `id name profileLocationGroups {
      locationGroup {
        id
      }
      locationGroupZones (first: 15) { edges { node {
        zone {
          id
          name
        }
        methodDefinitions (first: 10) { edges { node {
          id
          name
          active
        } } }
      } } }
    }`;
    const deliveryProfilesResponse = await shopifyDeliveryProfilesGet(selectedRegion, { attrs: deliveryProfileAttrs });
    const { success: deliveryProfilesGetSuccess, result: deliveryProfiles } = deliveryProfilesResponse;
    if (!deliveryProfilesGetSuccess) {
      return deliveryProfilesResponse;
    }

    // Map and flatten all delivery profiles to shipping method definitions
    const shippingMethodDefinitions = deliveryProfiles.map(dp => {
      const { id: deliveryProfileId, name: deliveryProfileName } = dp;
      return dp.profileLocationGroups.map(plg => {
        const { locationGroup } = plg;
        const { id: locationGroupId } = locationGroup;
        return plg.locationGroupZones.map(lgz => {
          const { zone } = lgz;
          const { id: locationGroupZoneId, name: locationGroupZoneName } = zone;
          return lgz.methodDefinitions.map(methodDef => {
            return {
              ...methodDef,
              deliveryProfileId,
              deliveryProfileName,
              locationGroupId,
              locationGroupZoneId,
              locationGroupZoneName,
            };
          });
        });
      });
    }).flat(3);

    const { value: payloadValue } = payload;
    const payloadValueTrimmed = payloadValue.trim();

    // Filter matching shipping method definitions
    const optionValues = shippingMethodDefinitions.filter(rate => rate.name.toLowerCase().includes(payloadValueTrimmed.toLowerCase()));
    const options = optionValues.map(value => {
      return {
        text: {
          type: 'plain_text',
          text: `${ value.name }`,
        },
        value: gidToId(value.id),
      }
    });
    logDeep('options', options);

    return respond(res, 200, { options });
  }

  // Because we got to this point, we have a payload - handle as an interactive step
  respond(res, 200); // Acknowledge immediately - we'll provide the next step to the response_url later

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
  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  logDeep({
    responseUrl,
    state,
    actionId,
    actionValue,
  });

  let response;

  switch (actionName) {

    case 'region_select':

      const region = actionNodes?.[0];

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.region_select.context(region),
          blocks.rates_select.ask,
          blocks.rates_select.context([]),
          blocks.action_buttons,
          blocks.cancel,
        ],
      };
      break;

    case 'rates_select':

      const selectedRegion = currentBlocksById['region_select:context']?.text?.text?.split('Selected region: ')?.[1]?.trim();
      logDeep('selectedRegion', selectedRegion);
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

module.exports = slackInteractiveShippingRatesToggle;