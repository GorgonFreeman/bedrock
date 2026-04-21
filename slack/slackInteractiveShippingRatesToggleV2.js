const { respond, logDeep, customAxios, gidToId, arrayToObj } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');
const { shopifyShippingRatesToggle } = require('../shopify/shopifyShippingRatesToggle');

const TOGGLING_LIST_HEADER = 'Toggling:';
const ENABLED_SYMBOL = ':white_check_mark:';
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
      block_id: 'store_selector:intro',
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

  profile_selector: {

    intro: {
      type: 'section',
      block_id: 'profile_selector:intro',
      text: {
        type: 'mrkdwn',
        text: 'Select a delivery profile:',
      },
    },

    breadcrumbs: (selectedStore) => {
      return {
        type: 'rich_text',
        block_id: 'profile_selector:breadcrumbs',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: `Home > ${ selectedStore.toUpperCase() }`,
                style: {
                  italic: true,
                },
              },
            ],
          },
        ],
      };
    },

    buttons: (store, profiles) => {
      return profiles.map(profile => {
        return {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: profile,
              },
              value: profile,
              action_id: `${ COMMAND_NAME }:profile_select:${ store }:${ profile }`,
            },
          ],
        };
      });
    },
  },

  zone_selector: {

    intro: {
      type: 'section',
      block_id: 'zone_selector:intro',
      text: {
        type: 'mrkdwn',
        text: 'Select a delivery zone:',
      },
    },

    breadcrumbs: (selectedStore, selectedProfile) => {
      return {
        type: 'rich_text',
        block_id: `zone_selector:breadcrumbs:${ selectedStore }:${ selectedProfile }`,
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: `Home > ${ selectedStore.toUpperCase() } > ${ selectedProfile }`,
                style: {
                  italic: true,
                },
              },
            ],
          }
        ],
      };
    },

    buttons: (store, profile, zones) => {
      return zones.map(zone => {
        return {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: zone,
              },
              value: zone,
              action_id: `${ COMMAND_NAME }:zone_select:${ store }:${ profile }:${ zone }`,
            }
          ],
        }
      });
    },

  },

  rate_toggle: {

    breadcrumbs: (selectedStore, selectedProfile, selectedZone) => {
      return {
        type: 'rich_text',
        block_id: 'rate_toggle:breadcrumbs',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: `Home > ${ selectedStore.toUpperCase() } > ${ selectedProfile } > ${ selectedZone }`,
                style: {
                  italic: true,
                },
              },
            ],
          },
        ],
      };
    },

    checkboxes: (selectedStore, selectedProfile, selectedZone, rates) => {
      return {
        type: 'section',
        block_id: `rate_toggle:checkboxes:${ selectedStore }:${ selectedProfile }:${ selectedZone }`,
        text: {
          type: 'mrkdwn',
          text: 'Select rates to toggle:',
        },
        accessory: {
          type: 'checkboxes',
          initial_options: rates.filter(rate => rate.enable).map(rate => {
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
          action_id: `${ COMMAND_NAME }:rate_toggle:${ selectedStore }:${ selectedProfile }:${ selectedZone }`,
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
        block_id: 'toggled_rates:list',
        text: {
          type: 'mrkdwn',
          text: `${ TOGGLING_LIST_HEADER }\n${ toggledRates.length > 0
            ? toggledRates.map(rate => `${ rate.enable ? ENABLED_SYMBOL : DISABLED_SYMBOL } | ${ rate.name } | Store: ${ rate.store.toUpperCase() } | Profile: ${ rate.deliveryProfileName } | Zone: ${ rate.locationGroupZoneName } | ${ gidToId(rate.id) }`).join('\n')
            : 'None' }`,
        },
      }
    },

  },

  error: (message) => {
    return {
      type: 'section',
      block_id: 'error:message',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    };
  },

  action_buttons: ({
    goBack = false,
    home = false,
  } = {}) => {
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
        ...(!home ? [] : [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Home',
            },
            value: 'home',
            action_id: `${ COMMAND_NAME }:home`,
          },
        ]),
        ...(!goBack ? [] : [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Go back',
            },
            value: 'go_back',
            action_id: `${ COMMAND_NAME }:go_back`,
          },
        ]),
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

  result: {

    loading: {
      type: 'section',
      block_id: 'result:loading',
      text: {
        type: 'mrkdwn',
        text: 'Toggling shipping rates...',
      },
    },

    list: (results) => {
      return {
        type: 'section',
        block_id: 'result:list',
        text: {
          type: 'mrkdwn',
          text: `Results:\n${ results.map(result => `${ result.name } | Store: ${ result.store.toUpperCase() } | Zone: ${ result.locationGroupZoneName } | ${ result.message }`).join('\n') }`,
        },
      };
    },
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
              enable: methodDef.active,
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
      blocks.action_buttons(),
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
    message,
  } = payload;

  const {
    blocks: currentBlocks,
  } = message;
  const currentBlocksById = arrayToObj(currentBlocks, { keyProp: 'block_id' });

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
  let selectedProfile;
  let selectedZone;
  let regionalShippingRates;
  let regionalShippingRatesForZone;
  let toggledRatesString = [];
  let ratesToggleStatus = [];

  const getRatesToggleStatus = () => {
    // Fetch the toggled rates context from the list block
    toggledRatesString =
      currentBlocksById['toggled_rates:list']?.text?.text?.split(TOGGLING_LIST_HEADER)?.[1]?.trim().split('\n')
      .map(rate => rate.trim());

    // Calculate the rates toggle status
    if (toggledRatesString[0] === 'None') {
      return shippingRatesByStore.map(rate => {
        return {
          ...rate,
          enable: rate.active,
        }
      });
    }
    return shippingRatesByStore.map(rate => {
      const rateString = toggledRatesString.find(rateString => rateString.split('|')[5]?.trim() === gidToId(rate.id));
      logDeep({ rateString });
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
  }

  switch (actionName) {

    case 'store_select':

      selectedStore = actionNodes?.[0];
      logDeep('selectedStore', selectedStore);

      regionalShippingRates = shippingRatesByStore
        .filter(rate => rate.store === selectedStore);
      logDeep({ regionalShippingRates });

      const regionalShippingProfiles = Array.from(new Set(regionalShippingRates.map(rate => rate.deliveryProfileName)));
      logDeep({ regionalShippingProfiles });

      // Fetch the toggled rates context from the list block
      ratesToggleStatus = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.profile_selector.breadcrumbs(selectedStore),
          blocks.profile_selector.intro,
          ...blocks.profile_selector.buttons(selectedStore, regionalShippingProfiles),
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons({ goBack: true }),
        ],
      }

      break;

    case 'profile_select':

      selectedStore = actionNodes?.[0];
      logDeep('selectedStore', selectedStore);

      selectedProfile = actionNodes?.[1];
      logDeep('selectedProfile', selectedProfile);

      regionalShippingRates = shippingRatesByStore
        .filter(rate => rate.store === selectedStore)
        .filter(rate => rate.deliveryProfileName === selectedProfile);
      logDeep({ regionalShippingRates });

      const regionalShippingZones = Array.from(new Set(regionalShippingRates.map(rate => rate.locationGroupZoneName)));
      logDeep({ regionalShippingZones });

      ratesToggleStatus = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.zone_selector.breadcrumbs(selectedStore, selectedProfile),
          blocks.zone_selector.intro,
          ...blocks.zone_selector.buttons(selectedStore, selectedProfile, regionalShippingZones),
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons({ goBack: true, home: true }),
        ],
      };
      break;

    case 'zone_select':

      selectedStore = actionNodes?.[0];
      logDeep('selectedStore', selectedStore);

      selectedProfile = actionNodes?.[1];
      logDeep('selectedProfile', selectedProfile);

      selectedZone = actionNodes?.[2];
      logDeep('selectedZone', selectedZone);

      regionalShippingRatesForZone = shippingRatesByStore
        .filter(rate => rate.store === selectedStore)
        .filter(rate => rate.deliveryProfileName === selectedProfile)
        .filter(rate => rate.locationGroupZoneName === selectedZone);
      logDeep({ regionalShippingRatesForZone });

      // Fetch the toggled rates context from the list block
      ratesToggleStatus = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      // Update the regional shipping rates for the zone with the toggled rates status
      regionalShippingRatesForZone = regionalShippingRatesForZone.map(rate => {
        const toggleStatus = ratesToggleStatus.find(rateToggleStatus => gidToId(rateToggleStatus.id) === gidToId(rate.id));
        return {
          ...rate,
          enable: toggleStatus?.enable ?? rate.active,
        }
      });
      logDeep({ regionalShippingRatesForZone });

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.rate_toggle.breadcrumbs(selectedStore, selectedProfile, selectedZone),
          blocks.rate_toggle.checkboxes(selectedStore, selectedProfile, selectedZone, regionalShippingRatesForZone),
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons({ home: true, goBack: true }),
        ],
      };
      break;

    case 'rate_toggle':

      selectedStore = actionNodes?.[0];
      logDeep('selectedStore', selectedStore);
      
      selectedProfile = actionNodes?.[1];
      logDeep('selectedProfile', selectedProfile);

      selectedZone = actionNodes?.[2];
      logDeep('selectedZone', selectedZone);

      regionalShippingRatesForZone = shippingRatesByStore
        .filter(rate => rate.store === selectedStore)
        .filter(rate => rate.deliveryProfileName === selectedProfile)
        .filter(rate => rate.locationGroupZoneName === selectedZone);
      logDeep({ regionalShippingRatesForZone });

      const selectedOptions = state.values[`rate_toggle:checkboxes:${ selectedStore }:${ selectedProfile }:${ selectedZone }`]?.[`${ COMMAND_NAME }:rate_toggle:${ selectedStore }:${ selectedProfile }:${ selectedZone }`]?.selected_options;
      logDeep({ selectedOptions });

      // Fetch the toggled rates context from the list block
      ratesToggleStatus = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      // Update the toggled rates context with the selected options
      ratesToggleStatus = ratesToggleStatus.map(rate => {
        if (!regionalShippingRatesForZone.some(rateForZone => gidToId(rateForZone.id) === gidToId(rate.id))) {
          return rate;
        }
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
          blocks.rate_toggle.breadcrumbs(selectedStore, selectedProfile, selectedZone),
          blocks.rate_toggle.checkboxes(selectedStore, selectedProfile, selectedZone, regionalShippingRatesForZone),
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons({ home: true, goBack: true }),
        ],
      };
      
      break;
    
    case 'home':

      // Fetch the toggled rates context from the list block
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
          blocks.action_buttons(),
        ],
      };
      break;

    case 'go_back':

      ratesToggleStatus = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      // Find the rate toggle checkbox block
      const rateToggleCheckboxBlock = Object.keys(currentBlocksById).find(key => key.startsWith('rate_toggle:checkboxes'));
      if (rateToggleCheckboxBlock) {

        const [selectedStore, selectedProfile, selectedZone] = rateToggleCheckboxBlock.split('rate_toggle:checkboxes:')[1].split(':');
        logDeep('selectedStore', selectedStore);
        logDeep('selectedProfile', selectedProfile);
        logDeep('selectedZone', selectedZone);

        regionalShippingRates = shippingRatesByStore
          .filter(rate => rate.store === selectedStore)
          .filter(rate => rate.deliveryProfileName === selectedProfile);
        logDeep({ regionalShippingRates });

        const regionalShippingZones = Array.from(new Set(regionalShippingRates.map(rate => rate.locationGroupZoneName)));
        logDeep({ regionalShippingZones });

        // Respond with the zone selector step
        response = {
          replace_original: 'true',
          blocks: [
            blocks.intro,
            blocks.zone_selector.breadcrumbs(selectedStore, selectedProfile),
            blocks.zone_selector.intro,
            ...blocks.zone_selector.buttons(selectedStore, selectedProfile, regionalShippingZones),
            blocks.divider,
            blocks.toggled_rates.list(ratesToggleStatus),
            blocks.divider,
            blocks.action_buttons({ goBack: true, home: true }),
          ],
        };
        break;
      }

      // Find the zone selector block
      const zoneSelectorBlock = Object.keys(currentBlocksById).find(key => key.startsWith('zone_selector:breadcrumbs'));
      logDeep({ zoneSelectorBlock });
      if (zoneSelectorBlock) {

        const [selectedStore, selectedProfile] = zoneSelectorBlock.split('zone_selector:breadcrumbs:')[1].split(':');
        logDeep('selectedStore', selectedStore);
        logDeep('selectedProfile', selectedProfile);
        
        regionalShippingRates = shippingRatesByStore
          .filter(rate => rate.store === selectedStore);
        logDeep({ regionalShippingRates });

        const regionalShippingProfiles = Array.from(new Set(regionalShippingRates.map(rate => rate.deliveryProfileName)));
        logDeep({ regionalShippingProfiles });
        
        response = {
          replace_original: 'true',
          blocks: [
            blocks.intro,
            blocks.profile_selector.breadcrumbs(selectedStore),
            blocks.profile_selector.intro,
            ...blocks.profile_selector.buttons(selectedStore, regionalShippingProfiles),
            blocks.divider,
            blocks.toggled_rates.list(ratesToggleStatus),
            blocks.divider,
            blocks.action_buttons({ goBack: true }),
          ],
        };
        break;
      }


      // Otherwise, go back to first step
      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.store_selector.intro,
          ...blocks.store_selector.buttons,
          blocks.divider,
          blocks.toggled_rates.list(ratesToggleStatus),
          blocks.divider,
          blocks.action_buttons(),
        ],
      }
      break;

    case 'submit':

      ratesToggleStatus = getRatesToggleStatus();
      logDeep({ ratesToggleStatus });

      const ratesToToggle = ratesToggleStatus.filter(rate => rate.enable !== rate.active);
      logDeep({ ratesToToggle });

      // If no rates to toggle, show an error and go back to the store selector
      if (ratesToToggle.length === 0) {
        response = {
          replace_original: 'true',
          blocks: [
            blocks.intro,
            blocks.store_selector.intro,
            ...blocks.store_selector.buttons,
            blocks.divider,
            blocks.toggled_rates.list(ratesToggleStatus),
            blocks.divider,
            blocks.error('No shipping rates toggled to be submitted!'),
            blocks.divider,
            blocks.action_buttons(),
          ],
        };
        break;
      }

      // Display loading message while toggling shipping rates
      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.result.loading,
        ],
      };
      await customAxios(responseUrl, {
        method: 'post',
        body: response,
      });

      // Update the toggled shipping rates
      const results = [];
      for (const rate of ratesToToggle) {
        const {
          id,
          store: credsPath,
          enable: enableRate,
        } = rate;
        mode = enableRate ? 'enable' : 'disable';
        const shippingRateUpdateResponse = await shopifyShippingRatesToggle(credsPath, mode, { shippingRateId: gidToId(id) });
        logDeep({ shippingRateUpdateResponse });
        const { success: shippingRateUpdateSuccess, result: shippingRateUpdateResult, error: shippingRateUpdateError } = shippingRateUpdateResponse;
        if (!shippingRateUpdateSuccess) {
          results.push({
            ...rate,
            success: false,
            message: shippingRateUpdateError,
          });
          continue;
        }
        results.push({
          ...rate,
          success: true,
          message: `Successfully ${ enableRate ? 'enabled' : 'disabled' }`,
        });
      }

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.result.list(results),
        ],
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

module.exports = slackInteractiveShippingRatesToggleV2;