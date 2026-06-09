const { funcApi, gidToId } = require('../utils');

const { shopifyLocationGetMain } = require('../shopify/shopifyLocationGetMain');

const collabsInventoryReviewOnHand = async (
  store,
  {
    locationId,
  } = {},
) => {

  const mainLocationResponse = await shopifyLocationGetMain(store);
  const { success: mainLocationSuccess, result: mainLocation } = mainLocationResponse;
  if (!mainLocationSuccess) {
    return mainLocationResponse;
  }

  if (!locationId) {
    console.log(`${ store }: Using main location`);

    const locationResponse = await shopifyLocationGetMain(store);

    const { 
      success: locationSuccess, 
      result: location, 
    } = locationResponse;
    if (!locationSuccess) {
      return locationResponse;
    }

    if (!location) {
      return {
        success: false,
        errors: ['No location found'],
      };
    }

    const { id: locationGid } = location;
    locationId = gidToId(locationGid);
  }

  !HOSTED && logDeep('locationId', locationId);

  return { 
    store, 
    locationId,
  };
  
};

const collabsInventoryReviewOnHandApi = funcApi(collabsInventoryReviewOnHand, {
  argNames: ['store', 'options'],
  validatorsByArg: {
    store: Boolean,
  },
  requireHostedApiKey: true,
  errorReporter: bedrock_unlisted_slackErrorPost,
});

module.exports = {
  collabsInventoryReviewOnHand,
  collabsInventoryReviewOnHandApi,
};

// curl localhost:8000/collabsInventoryReviewOnHand -H "Content-Type: application/json" -d '{ "store": "au" }'