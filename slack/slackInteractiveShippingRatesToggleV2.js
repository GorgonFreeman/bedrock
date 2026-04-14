const { respond, logDeep, customAxios, gidToId } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');

const DEFAULT_PROFILE_NAME = 'General profile';
const ENABLED_SYMBOL = ':white_tick:';
const DISABLED_SYMBOL = ':x:';

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
    type: 'divider',
  },

  store_selector: {

    intro: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Select a store:',
      },
    },

    buttons: REGIONS_WF.map(store => {
      return {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: store.toUpperCase(),
            },
            value: store,
            action_id: `${ COMMAND_NAME }:store_select:${ store }`,
          }
        ],
      }
    }),
  },

  zone_selector: {

    intro: {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Select a delivery zone:',
      },
    },

    buttons: (store, zones) => {
      return zones.map(zone => {
        return {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: zone.toUpperCase(),
              },
              value: zone,
              action_id: `${ COMMAND_NAME }:zone_select:${ store }:${ zone }`,
            }
          ],
        }
      });
    },

  },

  rate_toggle: {

    checkboxes: (selectedStore, selectedZone, rates) => {
      return {
        type: 'section',
        block_id: 'rate_toggle:checkboxes',
        text: {
          type: 'mrkdwn',
          text: 'Select rates to toggle:',
        },
        accessory: {
          type: 'checkboxes',
          initial_options: rates.filter(rate => rate.active).map(rate => {
            return {
              text: {
                type: 'plain_text',
                text: rate.name,
              },
              value: gidToId(rate.id),
            }
          }),
          options: rates.map(rate => {
            return {
              text: {
                type: 'plain_text',
                text: rate.name,
              },
              value: gidToId(rate.id),
            }
          }),
          action_id: `${ COMMAND_NAME }:rate_toggle:${ selectedStore }:${ selectedZone }`,
        },
      };
    },
  },

  toggled_rates: {

    list: (rates) => {

      // Filter rates that needs toggling
      const toggledRates = rates.filter(rate => rate.enable !== rate.active);

      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Will toggle:\n${ toggledRates.length > 0
            ? toggledRates.map(rate => `${ rate.enable ? ENABLED_SYMBOL : DISABLED_SYMBOL } | ${ rate.name } | Store: ${ rate.store.toUpperCase() } | Zone: ${ rate.locationGroupZoneName } | ${ gidToId(rate.id) }`).join('\n')
            : 'None' }`,
        },
      }
    },

  },

  action_buttons: ({ initialPage = false } = {}) => {
    return {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Submit',
          },
          value: 'submit',
          action_id: `${ COMMAND_NAME }:submit`,
        },
        ...(initialPage ? [] : [{
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Go back',
          },
          value: 'go_back',
          action_id: `${ COMMAND_NAME }:go_back`,
        }]),
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
    };
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
  const flatForStore = (deliveryProfiles, store) => {
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
              store,
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

  const shippingRatesByStore = await Promise.all(
    REGIONS_WF.map(async (store) => {
      const deliveryProfilesResponse = await shopifyDeliveryProfilesGet(store, { attrs: deliveryProfileAttrs });
      const { success: deliveryProfilesGetSuccess, result: deliveryProfiles } = deliveryProfilesResponse;
      if (!deliveryProfilesGetSuccess || !deliveryProfiles?.length) {
        return [];
      }
      return flatForStore(deliveryProfiles, store);
    }),
  );
  return shippingRatesByStore.flat();
};

const slackInteractiveShippingRatesToggleV2 = async (req, res) => {
  console.log('slackInteractiveShippingRatesToggleV2');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.intro,
      blocks.store_selector.intro,
      ...blocks.store_selector.buttons,
      blocks.divider,
      blocks.toggled_rates.list([]),
      blocks.divider,
      blocks.action_buttons({ initialPage: true }),
    ];

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }

  // Fetch all shipping rates
  const shippingRatesByStore = await deliveryProfilesGetFlatByStore();

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
  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  logDeep({
    responseUrl,
    state,
    actionId,
    actionValue,
  });

  let response;

  let selectedStore;
  let selectedZone;
  let regionalShippingRates;
  let regionalShippingRatesForZone;
  let toggledRatesString = [];
  let ratesToggleStatus = [];

  const getRatesToggleStatus = () => {
    // Fetch the toggled rates context from the list block
    toggledRatesString =
      currentBlocksById['toggled_rates:list']?.text?.text?.split('Will toggle:')?.[1]?.trim().split('\n')
      .map(rate => rate.trim());

    // Calculate the rates toggle status
    ratesToggleStatus = (() => {
      if (toggledRatesString[0] === 'None') {
        return shippingRatesByStore.map(rate => {
          return {
            ...rate,
            enable: rate.active,
          }
        });
      }
      return shippingRatesByStore.map(rate => {
        const rateString = toggledRatesString.find(rateString => rateString.split('|')[4]?.trim() === gidToId(rate.id));
        if (!rateString) {
          return {
            ...rate,
            enable: rate.active,
          }
        }
        const toggleIcon = rateString?.split('|')?.[0]?.trim();
        return {
          ...rate,
          enable: toggleIcon === ENABLED_SYMBOL,
        };
      });
    })();
  }

  switch (actionName) {

    case 'store_select':

      selectedStore = actionNodes?.[0];
      logDeep('selectedStore', selectedStore);

      regionalShippingRates = shippingRatesByStore
        .filter(rate => rate.store === selectedStore)
        .filter(rate => rate.deliveryProfileName === DEFAULT_PROFILE_NAME);
      logDeep({ regionalShippingRates });

      const regionalShippingZones = Array.from(new Set(regionalShippingRates.map(rate => rate.locationGroupZoneName)));
      logDeep({ regionalShippingZones });

      // Fetch the toggled rates context from the list block
      toggledRatesString = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.zone_selector.intro,
          ...blocks.zone_selector.buttons(selectedStore, regionalShippingZones),
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons(),
        ],
      }

      break;

    case 'zone_select':

      selectedStore = actionNodes?.[0];
      logDeep('selectedStore', selectedStore);

      selectedZone = actionNodes?.[1];
      logDeep('selectedZone', selectedZone);

      regionalShippingRatesForZone = shippingRatesByStore
        .filter(rate => rate.store === selectedStore)
        .filter(rate => rate.deliveryProfileName === DEFAULT_PROFILE_NAME)
        .filter(rate => rate.locationGroupZoneName === selectedZone);
      logDeep({ regionalShippingRatesForZone });

      // Fetch the toggled rates context from the list block
      toggledRatesString = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.rate_toggle.checkboxes(selectedStore, selectedZone, regionalShippingRatesForZone),
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons(),
        ],
      };
      break;

    case 'rate_toggle':

      selectedStore = actionNodes?.[0];
      logDeep('selectedStore', selectedStore);

      selectedZone = actionNodes?.[1];
      logDeep('selectedZone', selectedZone);

      regionalShippingRatesForZone = shippingRatesByStore
        .filter(rate => rate.store === selectedStore)
        .filter(rate => rate.deliveryProfileName === DEFAULT_PROFILE_NAME)
        .filter(rate => rate.locationGroupZoneName === selectedZone);
      logDeep({ regionalShippingRatesForZone });

      const selectedOptions = state.values['rate_toggle:checkboxes']?.[`${ COMMAND_NAME }:rate_toggle:${ selectedStore }:${ selectedZone }`]?.selected_options;
      logDeep({ selectedOptions });

      // Fetch the toggled rates context from the list block
      toggledRatesString = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      // Update the toggled rates context with the selected options
      ratesToggleStatus = regionalShippingRatesForZone.map(rate => {
        return {
          ...rate,
          enable: selectedOptions.some(option => option.value === gidToId(rate.id)),
        }
      });
      logDeep({ ratesToggleStatus });

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.rate_toggle.checkboxes(selectedStore, selectedZone, regionalShippingRatesForZone),
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons(),
        ],
      };
      
      break;
    
    case 'go_back':

      // Fetch the toggled rates context from the list block
      toggledRatesString =
        currentBlocksById['toggled_rates:list']?.text?.text?.split('Will toggle:')?.[1]?.trim().split('\n')
        .map(rate => rate.trim());

      ratesToggleStatus = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.store_selector.intro,
          ...blocks.store_selector.buttons,
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons({ initialPage: true }),
        ],
      };
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

module.exports = slackInteractiveShippingRatesToggleV2;