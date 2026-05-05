const { respond, logDeep, customAxios, arrayToObj } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');

const COMMAND_NAME = 'shipping_rates_disabled_report'; // slash command

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

  response = {
    replace_original: 'true',
    text: `I don't do anything yet :hugging_face:`,
  };

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveShippingRatesDisabledReport;