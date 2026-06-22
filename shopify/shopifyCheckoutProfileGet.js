// https://shopify.dev/docs/api/admin-graphql/latest/queries/checkoutProfile

const { respond, mandateParam, objHasAny, standardInterpreters, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyCheckoutProfilesGet } = require('../shopify/shopifyCheckoutProfilesGet');

const defaultAttrs = `
  id
  name
  isPublished
  createdAt
  editedAt
  updatedAt
  typOspPagesActive
`;

const shopifyCheckoutProfileGetSingle = async (
  credsPath,
  {
    checkoutProfileId,
    isPublished,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (checkoutProfileId) {
    const response = await shopifyGetSingle(
      credsPath,
      'checkoutProfile',
      checkoutProfileId,
      {
        apiVersion,
        attrs,
      },
    );

    return response;
  }

  /* isPublished */
  const response = await shopifyCheckoutProfilesGet(credsPath, {
    apiVersion,
    attrs,
    queries: [`is_published:${ isPublished }`],
  });

  const singleResponse = standardInterpreters.expectOne(response);

  return singleResponse;
  /* /isPublished */
};

const shopifyCheckoutProfileGet = async (
  credsPath,
  checkoutProfileIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    checkoutProfileIdentifier,
    shopifyCheckoutProfileGetSingle,
    (checkoutProfileIdentifier) => ({
      args: [credsPath, checkoutProfileIdentifier],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );

  return response;
};

const shopifyCheckoutProfileGetApi = async (req, res) => {
  const {
    credsPath,
    checkoutProfileIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'checkoutProfileIdentifier', checkoutProfileIdentifier, p => objHasAny(p, ['checkoutProfileId', 'isPublished'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCheckoutProfileGet(
    credsPath,
    checkoutProfileIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCheckoutProfileGet,
  shopifyCheckoutProfileGetApi,
};

// curl localhost:8000/shopifyCheckoutProfileGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "checkoutProfileIdentifier": { "checkoutProfileId": "890967685" } }'
// curl localhost:8000/shopifyCheckoutProfileGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "checkoutProfileIdentifier": { "isPublished": true } }'
