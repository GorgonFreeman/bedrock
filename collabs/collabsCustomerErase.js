const { funcApi } = require('../utils');
const { shopifyCustomerDelete } = require('../shopify/shopifyCustomerDelete');
const { shopifyCustomerRequestDataErasure } = require('../shopify/shopifyCustomerRequestDataErasure');
const { shopifyCustomerUpdate } = require('../shopify/shopifyCustomerUpdate');
const { shopifyCustomerMarketingConsentUpdateEmail } = require('../shopify/shopifyCustomerMarketingConsentUpdateEmail');
const { shopifyMetafieldsDelete } = require('../shopify/shopifyMetafieldsDelete');

const collabsCustomerErase = async (
  shopifyRegion,
  shopifyCustomerId,
  {
    option,
  } = {},
) => {

  // 1. Try deleting the customer from Shopify
  // TODO: Consider deleting from all stores
  // TODO: Support other Shopify customer identifiers, e.g. email

  let customerDeleted = false;
  let result = {};

  const shopifyDeleteResponse = await shopifyCustomerDelete(shopifyRegion, shopifyCustomerId);

  const { 
    success: deleteSuccess,
    result: deleteResult,
  } = shopifyDeleteResponse;

  customerDeleted = deleteSuccess;
  result.deleteResult = deleteResult;

  // 2. If the delete fails, 
  // 2a. request data erasure
  // 2b. delete name, email, addresses, and unsubscribe from marketing

  if (!customerDeleted) {

    const [
      shopifyRequestDataErasureResponse,
      customerUpdateResponse,
      customerEmailUnsubscribeResponse,
      customerMetafieldsDeleteResponse,
    ] = await Promise.all([
      shopifyCustomerRequestDataErasure(shopifyRegion, shopifyCustomerId),
      shopifyCustomerUpdate(shopifyRegion, shopifyCustomerId, {
        firstName: null,
        lastName: null,
        phone: null,
        addresses: [],
      }),
      shopifyCustomerMarketingConsentUpdateEmail(shopifyRegion, shopifyCustomerId, 'UNSUBSCRIBED'),
      shopifyMetafieldsDelete(shopifyRegion, [
        {
          namespace: 'facts',
          key: 'birth_date',
        },
        {
          namespace: 'facts',
          key: 'province_code',
        },
        {
          namespace: 'facts',
          key: 'country_code',
        },
        {
          namespace: 'facts',
          key: 'gender',
        },
        {
          namespace: 'facts',
          key: 'zip_code',
        },
      ].map(mf => ({ ...mf, ownerId: shopifyCustomerId }))),
    ]);

    result.shopifyRequestDataErasureResponse = shopifyRequestDataErasureResponse;
    result.customerUpdateResponse = customerUpdateResponse;
    result.customerEmailUnsubscribeResponse = customerEmailUnsubscribeResponse;
    result.customerMetafieldsDeleteResponse = customerMetafieldsDeleteResponse;
  }

  // 3. Consider deleting from other platforms, e.g. Salesforce

  return {
    success: true,
    result,
  };
};

const collabsCustomerEraseApi = funcApi(collabsCustomerErase, {
  argNames: ['shopifyRegion', 'shopifyCustomerId', 'options'],
});

module.exports = {
  collabsCustomerErase,
  collabsCustomerEraseApi,
};

// curl localhost:8000/collabsCustomerErase -H "Content-Type: application/json" -d '{ "shopifyRegion": "uk", "shopifyCustomerId": "22264206098805" }'