const { funcApi, logDeep, gidToId } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');
const { slackMessagePost } = require('../slack/slackMessagePost');

// define slack bot associated details
const COMMAND_NAME = 'shipping_rates_disabled_report'; // slash command related to this script
const SLACK_CHANNEL = 'foxtron_testing'

const snoozeOptions = [
  {
    text: "Remind me tomorrow",
    value: "remind_tomorrow",
  },
  {
    text: "Remind me in 1 week",
    value: "remind_1_week",
  },
  {
    text: "Mute permanently",
    value: "mute_permanently",
  },
]
const defaultSnoozeOption = snoozeOptions.find(option => option.value === 'remind_tomorrow');

const blocks = {

  intro: {
    type: 'section',
    block_id: 'intro',
    text: {
      type: 'mrkdwn',
      text: 'Disabled Shipping Rates:',
    },
  },

  divider: {
    type: 'divider',
  },

  disabled_rate_row: (rate) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ rate.name } | Store: ${ rate.store.toUpperCase() } | Profile: ${ rate.deliveryProfileName } | Zone: ${ rate.locationGroupZoneName }`,
      },
      accessory: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Select an action',
        },
        initial_option: () => {
          const defaultOption = snoozeOptions.find(option => option.value === 'remind_tomorrow');
          return {
            text: {
              type: 'plain_text',
              text: defaultOption.text,
            },
            value: defaultOption.value,
          }
        },
        options: snoozeOptions.map(option => {
          return {
            text: {
              type: 'plain_text',
              text: option.text,
            },
            value: option.value,
          };
        }),
        value: gidToId(rate.id),
      },
    };
  },

  buttons: {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Save reminders',
        },
        value: 'send_to_slack',
        action_id: `${ COMMAND_NAME }:save_reminders`,
      },
    ],
  }

};

const shopifyShippingRatesDisabledReport = async (
  {
    regions = REGIONS_WF,
    apiVersion,
  } = {},
) => {

  // 1. Fetch all shipping rates from all regions
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

  // Flatten the shipping rates by store
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

  // Fetch all shipping rates from all regions
  const shippingRatesUnflattened = await Promise.all(
    regions.map(async (store) => {
      const deliveryProfilesResponse = await shopifyDeliveryProfilesGet(store, { attrs: deliveryProfileAttrs });
      const { success: deliveryProfilesGetSuccess, result: deliveryProfiles } = deliveryProfilesResponse;
      if (!deliveryProfilesGetSuccess || !deliveryProfiles?.length) {
        return [];
      }
      return flatForStore(deliveryProfiles, store);
    }),
  );
  shippingRates = shippingRatesUnflattened.flat();
  // logDeep({ shippingRates });

  // 2. Filter out the shipping rates that are disabled
  const disabledShippingRates = shippingRates.filter(rate => !rate.active);
  // logDeep({ disabledShippingRates });

  // 3. Report the disabled shipping rates to defined slack users/channels

  const initialBlocks = [
    blocks.intro,
    blocks.divider,
    ...disabledShippingRates.map(rate => blocks.disabled_rate_row(rate)),
    blocks.divider,
    blocks.buttons,
  ];

  const slackMessagePostResponse = await slackMessagePost(SLACK_CHANNEL, {
    blocks: initialBlocks,
  });
  // logDeep({ slackMessagePostResponse });

  return {
    success: true,
    result: {
      disabledShippingRates,
      slackMessagePostResponse,
    },
  }
};

const shopifyShippingRatesDisabledReportApi = funcApi(shopifyShippingRatesDisabledReport, {
  argNames: ['options'],
});

module.exports = {
  shopifyShippingRatesDisabledReport,
  shopifyShippingRatesDisabledReportApi,
};

// curl localhost:8000/shopifyShippingRatesDisabledReport
// curl localhost:8000/shopifyShippingRatesDisabledReport -H "Content-Type: application/json" -d '{ "options": { "regions": ["au"] } }'