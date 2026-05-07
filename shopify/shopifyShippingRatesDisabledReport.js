const { funcApi, logDeep, gidToId, askQuestion, dateFromNow, hours } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');
const { shopifyMetafieldGet } = require('../shopify/shopifyMetafieldGet');
const { slackMessagePost } = require('../slack/slackMessagePost');

// Define the metafield key and namespace for the disabled shipping rates snooze options
const METAFIELD_DEFAULT_CREDS_PATH = 'au';
const METAFIELD_SHOP_ID = 'gid://shopify/Shop/21971730504';
const METAFIELD_NAMESPACE = 'shipping_rates';
const METAFIELD_KEY = 'alerts';

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
      text: '*Disabled Shipping Rates:*',
    },
  },

  divider: {
    type: 'divider',
  },

  disabled_rate_row: (rate) => {
    return {
      type: 'section',
      block_id: `disabled_rate_row:${ gidToId(rate.id) }`,
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
        initial_option: {
          text: {
            type: 'plain_text',
            text: defaultSnoozeOption.text,
          },
          value: defaultSnoozeOption.value,
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
        action_id: `${ COMMAND_NAME }:snooze_select:${ gidToId(rate.id) }`,
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
        value: 'save_reminders',
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

  // 2.1 Fetch the alerts metafield
  const alertsMetafieldResponse = await shopifyMetafieldGet(METAFIELD_DEFAULT_CREDS_PATH, {
    resource: 'shop',
    resourceId: 'shop',
    namespace: METAFIELD_NAMESPACE,
    key: METAFIELD_KEY,
  });
  const alertsMetafield = JSON.parse(alertsMetafieldResponse.result?.value || '{}');

  // 2.2 Filter out the shipping rates that are disabled and are due to be reminded
  const disabledShippingRates = shippingRates.filter(rate => {
    const nextAlertDate = alertsMetafield[gidToId(rate.id)]?.nextAlertDate;
    if (!nextAlertDate) {
      // Remind all rates with no next alert date set
      return !rate.active;
    }
    // If the next alert date is today or in the past, add the rate to reminder list
    return !rate.active && new Date(nextAlertDate) <= new Date(dateFromNow({ plus: hours(11), dateOnly: true }));
  });

  // return early if there are no disabled shipping rates due to be reminded
  if (!disabledShippingRates.length) {
    return {
      success: true,
      result: {
        disabledShippingRates,
        slackMessagePostResponse: null,
      },
    };
  }

  // 3. Report the disabled shipping rates to defined slack users/channels

  const initialBlocks = [
    blocks.intro,
    blocks.divider,
    ...disabledShippingRates.map(rate => blocks.disabled_rate_row(rate)),
    blocks.divider,
    blocks.buttons,
  ];

  const slackMessagePostResponse = await slackMessagePost(
    {
      channelName: SLACK_CHANNEL,
    },
    {
      blocks: initialBlocks,
    },
    {
      // Use the dev slack bot for testing
      credsPath: 'slack.dev',
    },
  );
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