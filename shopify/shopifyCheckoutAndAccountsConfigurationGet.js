// https://shopify.dev/docs/api/admin-graphql/latest/queries/checkoutAndAccountsConfiguration

const { respond, mandateParam, objHasAny, standardInterpreters, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyCheckoutAndAccountsConfigurationsGet } = require('../shopify/shopifyCheckoutAndAccountsConfigurationsGet');

const defaultAttrs = `
  id
  name
  isPublished
  createdAt
  editedAt
  updatedAt
`;

const shopifyCheckoutAndAccountsConfigurationGetSingle = async (
  credsPath,
  {
    checkoutAndAccountsConfigurationId,
    isPublished,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (checkoutAndAccountsConfigurationId) {
    const response = await shopifyGetSingle(
      credsPath,
      'checkoutAndAccountsConfiguration',
      checkoutAndAccountsConfigurationId,
      {
        apiVersion,
        attrs,
      },
    );

    return response;
  }

  /* isPublished */
  const response = await shopifyCheckoutAndAccountsConfigurationsGet(credsPath, {
    apiVersion,
    attrs,
    queries: [`is_published:${ isPublished }`],
  });

  const singleResponse = standardInterpreters.expectOne(response);

  return singleResponse;
  /* /isPublished */
};

const shopifyCheckoutAndAccountsConfigurationGet = async (
  credsPath,
  checkoutAndAccountsConfigurationIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    checkoutAndAccountsConfigurationIdentifier,
    shopifyCheckoutAndAccountsConfigurationGetSingle,
    (checkoutAndAccountsConfigurationIdentifier) => ({
      args: [credsPath, checkoutAndAccountsConfigurationIdentifier],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );

  return response;
};

const shopifyCheckoutAndAccountsConfigurationGetApi = async (req, res) => {
  const {
    credsPath,
    checkoutAndAccountsConfigurationIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'checkoutAndAccountsConfigurationIdentifier', checkoutAndAccountsConfigurationIdentifier, p => objHasAny(p, ['checkoutAndAccountsConfigurationId', 'isPublished'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCheckoutAndAccountsConfigurationGet(
    credsPath,
    checkoutAndAccountsConfigurationIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCheckoutAndAccountsConfigurationGet,
  shopifyCheckoutAndAccountsConfigurationGetApi,
};

// curl localhost:8000/shopifyCheckoutAndAccountsConfigurationGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "checkoutAndAccountsConfigurationIdentifier": { "checkoutAndAccountsConfigurationId": "123456789" }, "options": { "apiVersion": "2026-04" } }'
// curl localhost:8000/shopifyCheckoutAndAccountsConfigurationGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "checkoutAndAccountsConfigurationIdentifier": { "isPublished": true }, "options": { "apiVersion": "2026-04" } }'
