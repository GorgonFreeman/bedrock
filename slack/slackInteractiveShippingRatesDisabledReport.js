const { respond, logDeep, customAxios, arrayToObj, gidToId, dateFromNow, days, hours } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');
const { shopifyMetafieldGet } = require('../shopify/shopifyMetafieldGet');
const { shopifyMetafieldsSet } = require('../shopify/shopifyMetafieldsSet');

const METAFIELD_DEFAULT_CREDS_PATH = 'au';
const METAFIELD_SHOP_ID = 'gid://shopify/Shop/21971730504';
const METAFIELD_NAMESPACE = 'shipping_rates';
const METAFIELD_KEY = 'alerts';

const COMMAND_NAME = 'shipping_rates_disabled_report'; // slash command

const blocks = {

  intro: {
    type: 'section',
    block_id: 'intro',
    text: {
      type: 'mrkdwn',
      text: '*Disabled Shipping Rates:*',
    },
  },

  result: (shippingRates, metafieldAlertsObject) => {
    return {
      type: 'section',
      block_id: 'result',
      text: {
        type: 'mrkdwn',
        text: `${ Object.entries(metafieldAlertsObject).map(([id, alert]) => {
          const shippingRate = shippingRates.find(rate => gidToId(rate.id) === id) || {};
          return `${ shippingRate.name } (${ shippingRate.store.toUpperCase() } | ${ shippingRate.locationGroupZoneName }) | Will remind again on: ${ alert.nextAlertDate }`;
        }).join('\n') }`,
      },
    };
  },

}

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

const slackInteractiveShippingRatesDisabledReport = async (req, res) => {
  console.log('slackInteractiveShippingRatesDisabledReport');

  const { body } = req;
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {
    // This is not a slash command, so we don't need to send any initial blocks
  }

  // Because we got to this point, we have a payload - handle as an interactive step
  respond(res, 200); // Acknowledge immediately - we'll provide the next step to the response_url later

  // Fetch all shipping rates
  const shippingRatesByStore = await deliveryProfilesGetFlatByStore();

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

  switch (actionName) {

    case 'snooze_select':

      return;

    case 'save_reminders':

      const shippingRateRowObjects = Object.entries(state.values)
        .filter(([blockId, block]) => blockId.startsWith(`disabled_rate_row:`))
        .map(([blockId, block]) => {
          const shippingRateId = gidToId(blockId.split(':')?.[1]) || '';
          const selectedSnoozeOption = block?.[`${ COMMAND_NAME }:snooze_select:${ shippingRateId }`]?.selected_option?.value;
          return {
            id: shippingRateId,
            snoozeOption: selectedSnoozeOption,
          };
        });

      const alertsMetafieldResponse = await shopifyMetafieldGet(METAFIELD_DEFAULT_CREDS_PATH, {
        resource: 'shop',
        resourceId: 'shop',
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
      });
      const metafieldAlertsObject = JSON.parse(alertsMetafieldResponse.result?.value || '{}');;
      for (const shippingRateRowObject of shippingRateRowObjects) {
        const { id, snoozeOption } = shippingRateRowObject;
        const nextAlertDate = () => {
          switch (snoozeOption) {
            case 'mute_permanently':
              return null;
            case 'remind_1_week':
              return dateFromNow({ plus: (days(7) + hours(11)), dateOnly: true });
            case 'remind_tomorrow':
            default:
              return dateFromNow({ plus: (days(1) + hours(11)), dateOnly: true });
          }
        };
        metafieldAlertsObject[id] = {
          nextAlertDate: nextAlertDate(),
        };
      }
      // logDeep({ metafieldAlertsObject });

      const metafields = [{
        ownerId: METAFIELD_SHOP_ID,
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
        type: 'json',
        value: JSON.stringify(metafieldAlertsObject),
      }];
      const metafieldsSetResponse = await shopifyMetafieldsSet(METAFIELD_DEFAULT_CREDS_PATH, metafields);
      logDeep({ metafieldsSetResponse });

      response = {
        replace_original: 'true',
        blocks: [
          blocks.intro,
          blocks.result(shippingRatesByStore, metafieldAlertsObject),
        ],
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

module.exports = slackInteractiveShippingRatesDisabledReport;