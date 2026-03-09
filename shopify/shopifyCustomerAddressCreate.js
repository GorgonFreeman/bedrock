// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerAddressCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `address1 address2 city countryCode provinceCode zip`;

const shopifyCustomerAddressCreate = async (
  credsPath,
  customerId,
  addressInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,

    setAsDefault = false,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'customerAddressCreate',
    {
      customerId: {
        type: 'ID!',
        value: `gid://shopify/Customer/${ customerId }`,
      },
      address: {
        type: 'MailingAddressInput!',
        value: addressInput,
      },
      ...(setAsDefault && {
        setAsDefault: {
          type: 'Boolean',
          value: setAsDefault,
        },
      }),
    },
    `address { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyCustomerAddressCreateApi = funcApi(shopifyCustomerAddressCreate, {
  argNames: ['credsPath', 'customerId', 'addressInput', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    customerId: Boolean,
    addressInput: Boolean,
  },
});

module.exports = {
  shopifyCustomerAddressCreate,
  shopifyCustomerAddressCreateApi,
};

// curl http://localhost:8000/shopifyCustomerAddressCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerId": "gid://shopify/Customer/1234567890", "addressInput": { "address1": "123 Main St", "city": "Anytown", "countryCode": "US", "provinceCode": "CA", "zip": "12345" } }'