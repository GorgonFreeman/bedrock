// https://shopify.dev/docs/api/admin-graphql/latest/queries/customer
// https://shopify.dev/docs/api/admin-graphql/latest/queries/customerbyidentifier

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id firstName lastName email phone`;

const shopifyCustomerGet = async (
  credsPath,
  {
    customerId,
    customId,
    email,
    phone,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (!customerId) {

    const query = `
      query GetCustomerByIdentifier ($identifier: CustomerIdentifierInput!) {
        customer: customerByIdentifier(identifier: $identifier) {
          ${ attrs }
        } 
      }
    `;

    const variables = {
      identifier: {
        ...customId && { customId },
        ...email && { emailAddress: email },
        ...phone && { phoneNumber: phone },
      },
    };

    const response = await shopifyClient.fetch({
      method: 'post',
      body: { query, variables },
      context: {
        credsPath,
        apiVersion,
      },
      interpreter: async (response) => {
        // console.log(response);
        return {
          ...response,
          ...response.result ? {
            result: response.result.customer,
          } : {},
        };
      },
    });
    
    logDeep(response);
    return response;
  }

  const response = await shopifyGetSingle(
    credsPath,
    'customer',
    customerId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const shopifyCustomerGetApi = async (req, res) => {
  const { 
    credsPath,
    customerIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerIdentifier', customerIdentifier, p => objHasAny(p, ['customerId', 'customId', 'email', 'phone'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerGet(
    credsPath,
    customerIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerGet,
  shopifyCustomerGetApi,
};

// curl localhost:8000/shopifyCustomerGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerId": "6940089385032" } }'
// curl localhost:8000/shopifyCustomerGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "email": "john+testsms3@whitefoxboutique.com" } }'
// curl localhost:8000/shopifyCustomerGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "phone": "+61400000000" } }'