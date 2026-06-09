const { HOSTED } = require('../constants');
const { funcApi, gidToId, logDeep } = require('../utils');

const { bedrock_unlisted_slackErrorPost } = require('../bedrock_unlisted/bedrock_unlisted_slackErrorPost');

const { shopifyLocationGetMain } = require('../shopify/shopifyLocationGetMain');
const { shopifyInventoryItemsGet } = require('../shopify/shopifyInventoryItemsGet');

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

  const inventoryItemsResponse = await shopifyInventoryItemsGet(store, {
    attrs: `
      id
      sku
      inventoryLevels(first: 50) {
        edges {
          node {
            location {
              id
              name
            }
            quantities(names: [
              "available",
              "on_hand",
            ]) {
              name
              quantity
            } 
          } 
        } 
      }
    `,
  });

  const {
    success: inventoryItemsSuccess,
    result: inventoryItems,
  } = inventoryItemsResponse;
  if (!inventoryItemsSuccess) {
    return inventoryItemsResponse;
  }

  const inventoryReviewObj = {};

  for (const inventoryItem of inventoryItems) {
    const { 
      id: inventoryItemGid, 
      sku,
      inventoryLevels,
    } = inventoryItem;
    const inventoryItemId = gidToId(inventoryItemGid);
    const inventoryLevel = inventoryLevels.find(level => level.location.id === `gid://shopify/Location/${ locationId }`);
    const quantity = inventoryLevel.quantities.find(quantity => quantity.name === 'on_hand').quantity;
    inventoryReviewObj[sku] = {
      shopifyOnHand: quantity,
      shopifyInventoryItemId: inventoryItemId,
    };
  }

  !HOSTED && logDeep('inventoryReviewObj', inventoryReviewObj);
  
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