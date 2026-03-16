// https://shopify.dev/docs/api/admin-graphql/latest/queries/things

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id codeDiscount { __typename ... on DiscountCodeBasic { title summary status } }`;

const shopifyDiscountGet = async (
  credsPath,
  {
    discountId,
    discountCode,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (discountId) {
    console.log('Fetching with discountId', discountId);
    const response = await shopifyGetSingle(
      credsPath,
      'discount',
      discountId,
      {
        apiVersion,
        attrs,
      }
    )
    return response;
  }

  if (discountCode) {
    console.log('Fetching with discountCode', discountCode);
    const query = `
      query GetDiscountByCode ($code: String!) {
        codeDiscountNodeByCode(code: $code) {
          ${ attrs }
        }
      }
    `;
    const variables = {
      code: discountCode,
    };
    const response = await shopifyClient.fetch({
      method: 'post',
      body: { query, variables },
      context: {
        credsPath,
        apiVersion,
      },
      interpreter: async (response) => {
        return {
          ...response,
          ...response.result ? {
            result: response.result.codeDiscountNodeByCode,
          } : {},
        };
      },
    });

    logDeep(response);
    return response;
  }

  return {
    success: false,
    error: ['Invalid discount identifier provided'],
  };
};

const shopifyDiscountGetApi = async (req, res) => {
  const {
    credsPath,
    discountIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'discountIdentifier', discountIdentifier, p => objHasAny(p, ['discountId', 'discountCode'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyDiscountGet(
    credsPath,
    discountIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyDiscountGet,
  shopifyDiscountGetApi,
};

// curl localhost:8000/shopifyDiscountGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "discountIdentifier": { "discountCode": "STAFF40" } }'