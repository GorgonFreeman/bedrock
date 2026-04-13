const { respond, logDeep, customAxios } = require('../utils');
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

  divider: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '--------------------------------',
    },
  },

  store_selector: {

    buttons: REGIONS_WF.map(region => {
      return {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: region.toUpperCase(),
            },
            value: region,
            action_id: `${ COMMAND_NAME }:store_select:${ region }`,
          }
        ],
      }
    }),
  },

  zone_selector: {

    buttons: (store, zones) => {
      return zones.map(zone => {
        return {
          type: 'button',
          text: {
            type: 'plain_text',
            text: zone.toUpperCase(),
          },
          value: zone,
          action_id: `${ COMMAND_NAME }:zone_select:${ store }:${ zone }`,
        }
      });
    },

  },

  rate_selector: {

    checkboxes: (rates) => {
      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Select rates to toggle:',
        },
        accessory: {
          type: 'checkboxes',
          options: rates.map(rate => {
            return {
              text: {
                type: 'plain_text',
                text: rate.toUpperCase(),
              },
              value: rate,
            }
          }),
          action_id: `${ COMMAND_NAME }:rate_select`,
        },
      };
    },
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
        value: 'cancel',
        action_id: `${ COMMAND_NAME }:cancel`,
      },
    ],
  },

};

// Fetch a flattened lisst of shipping rates per store
const deliveryProfilesGetFlatByStore = async () => {
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
  const flatForRegion = (deliveryProfiles, region) => {
    return deliveryProfiles.map(dp => {
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
              region,
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
  };

  return Promise.all(
    REGIONS_WF.map(async (region) => {
      const deliveryProfilesResponse = await shopifyDeliveryProfilesGet(region, { attrs: deliveryProfileAttrs });
      const { success: deliveryProfilesGetSuccess, result: deliveryProfiles } = deliveryProfilesResponse;
      if (!deliveryProfilesGetSuccess || !deliveryProfiles?.length) {
        return [];
      }
      return flatForRegion(deliveryProfiles, region);
    }),
  );
};

const slackInteractiveShippingRatesToggleV2 = async (req, res) => {
  console.log('slackInteractiveShippingRatesToggleV2');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      ...blocks.store_selector.buttons,
      blocks.cancel,
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

  switch (actionName) {

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

module.exports = slackInteractiveShippingRatesToggleV2;