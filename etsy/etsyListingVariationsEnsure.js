const { logDeep, funcApi, askQuestion, arrayStandardResponse } = require('../utils');
const { etsyShopListingsGet } = require('../etsy/etsyShopListingsGet');
const { etsyListingInventoryUpdate } = require('../etsy/etsyListingInventoryUpdate');

const etsyListingVariationsEnsure = async (
  variationName,
  variationOptions,
  {
    credsPath,
  } = {},
) => {

  const listingsResponse = await etsyShopListingsGet({ credsPath, includes: ['Inventory'] });
  const { success: listingsSuccess, result: listings } = listingsResponse;
  if (!listingsSuccess) {
    return listingsResponse;
  }

  logDeep(listings);
  // await askQuestion('?');

  const responses = [];

  for (const listing of listings) {
    const existingVariations = listing.inventory.products.flatMap(product => product.property_values.filter(property_value => property_value.property_name === variationName)).flatMap(property_value => property_value.values);
    const missingVariations = variationOptions.filter(variation => !existingVariations.includes(variation));

    if (!missingVariations?.length) {
      continue;
    }

    logDeep(existingVariations);
    // await askQuestion('?');

    logDeep(missingVariations);
    // await askQuestion('?');

    const modelProduct = listing.inventory.products?.[0];
    const modelOffering = modelProduct?.offerings?.[0];
    if (!modelProduct || !modelOffering) {
      return {
        success: false,
        error: ['No model product/offering found'],
      };
    }

    logDeep(modelProduct);
    // await askQuestion('?');

    const propertyId = modelProduct.property_values.find(property_value => property_value.property_name === variationName)?.property_id;

    const productToSubmittable = (product) => {
      const { 
        product_id: discardA, 
        is_deleted: discardB, 
        offerings,
        property_values: propertyValues,
        ...productSubmittable
      } = product;

      return {
        ...productSubmittable,
        offerings: offerings.map(({ 
          offering_id: discardC, 
          is_deleted: discardD,
          price: offeringPrice, 
          ...offeringSubmittable
        }) => {
          const { amount, divisor } = offeringPrice;
          const priceDecimal = amount / divisor;

          return {
            ...offeringSubmittable,
            price: priceDecimal,
          };
        }),
        property_values: propertyValues.map(({ 
          scale_name: discardE, 
          ...propertyValueSubmittable
        }) => propertyValueSubmittable),
      };
    };

    const listingInventoryUpdatePayload = {
      products: [
        ...listing.inventory.products.filter(product => product.property_values.find(property_value => property_value.property_name === variationName)).map(productToSubmittable),
        ...missingVariations.map(variation => ({
          ...productToSubmittable(modelProduct),
          property_values: [{
            property_id: propertyId,
            property_name: variationName,
            value_ids: [],
            values: [variation],
          }],
        })),
      ],
    };
    logDeep(listingInventoryUpdatePayload);
    // await askQuestion('?');

    const response = await etsyListingInventoryUpdate(listing.listing_id, listingInventoryUpdatePayload, { credsPath });
    logDeep(response);
    // await askQuestion('?');
    responses.push(response);
  }

  const response = arrayStandardResponse(responses);
  logDeep(response);
  return response;
};

const etsyListingVariationsEnsureApi = funcApi(etsyListingVariationsEnsure, {
  argNames: ['variationName', 'variationOptions', 'options'],
  validatorsByArg: {
    variationName: Boolean,
    variationOptions: Boolean,
  },
});

module.exports = {
  etsyListingVariationsEnsure,
  etsyListingVariationsEnsureApi,
};

// curl localhost:8000/etsyListingVariationsEnsure -H "Content-Type: application/json" -d '{ "variationName": "Device", "variationOptions": ["iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "Google Pixel 9", "Google Pixel 9 Pro", "Google Pixel 9 Pro XL", "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 15 Plus", "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 14 Plus", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 13 Mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 12 Mini", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS MAX", "iPhone 8", "iPhone 8 Plus", "Samsung Galaxy S24", "Samsung Galaxy S24 Plus", "Samsung Galaxy S24 Ultra", "Samsung Galaxy S23", "Samsung Galaxy S23 Plus", "Samsung Galaxy S23 Ultra", "Samsung Galaxy S22", "Samsung Galaxy S22 Plus", "Samsung Galaxy S22 Ultra", "Samsung Galaxy S21", "Samsung Galaxy S21 Plus", "Samsung Galaxy S21 Ultra", "Samsung Galaxy S21 FE", "Samsung Galaxy S20", "Samsung Galaxy S20+", "Samsung Galaxy S20 Ultra", "Samsung Galaxy S20 FE", "Samsung Galaxy S10", "Samsung Galaxy S10E", "Samsung Galaxy S10 Plus", "Google Pixel 8 Pro", "Google Pixel 8", "Google Pixel 7", "Google Pixel 6 Pro", "Google Pixel 6", "Google Pixel 5 5G"] }'