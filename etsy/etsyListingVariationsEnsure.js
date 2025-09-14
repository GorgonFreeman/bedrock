const { logDeep, funcApi, askQuestion } = require('../utils');
const { etsyShopListingsGet } = require('../etsy/etsyShopListingsGet');

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
  await askQuestion('?');

  for (const listing of listings) {
    const existingVariations = listing.inventory.products.flatMap(product => product.property_values.filter(property_value => property_value.property_name === variationName)).flatMap(property_value => property_value.values);
    logDeep(existingVariations);
    await askQuestion('?');

    const missingVariations = variationOptions.filter(variation => !existingVariations.includes(variation));
    logDeep(missingVariations);
    await askQuestion('?');

    if (!missingVariations?.length) {
      continue;
    }
  }

  const response = {
    variationName,
    variationOptions,
    credsPath,
  };
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

// curl localhost:8000/etsyListingVariationsEnsure -H "Content-Type: application/json" -d '{ "variationName": "Device", "variationOptions": ["iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "Google Pixel 9", "Google Pixel 9 Pro", "Google Pixel 9 Pro XL", "Google Pixel 2", "Google Pixel 2 XL", "Google Pixel 3", "Google Pixel 3 XL", "Google Pixel 3a", "Google Pixel 3a XL", "Google Pixel 4", "Google Pixel 4 XL", "Google Pixel 4a", "Google Pixel 4a 5G", "Google Pixel", "Google Pixel XL", "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 15 Plus", "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 14 Plus", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 13 Mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 12 Mini", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS MAX", "iPhone 8", "iPhone 8 Plus", "Samsung Galaxy S24", "Samsung Galaxy S24 Plus", "Samsung Galaxy S24 Ultra", "Samsung Galaxy S23", "Samsung Galaxy S23 Plus", "Samsung Galaxy S23 Ultra", "Samsung Galaxy S22", "Samsung Galaxy S22 Plus", "Samsung Galaxy S22 Ultra", "Samsung Galaxy S21", "Samsung Galaxy S21 Plus", "Samsung Galaxy S21 Ultra", "Samsung Galaxy S21 FE", "Samsung Galaxy S20", "Samsung Galaxy S20+", "Samsung Galaxy S20 Ultra", "Samsung Galaxy S20 FE", "Samsung Galaxy S10", "Samsung Galaxy S10E", "Samsung Galaxy S10 Plus", "Google Pixel 8 Pro", "Google Pixel 8", "Google Pixel 7", "Google Pixel 6 Pro", "Google Pixel 6", "Google Pixel 5 5G"] }'