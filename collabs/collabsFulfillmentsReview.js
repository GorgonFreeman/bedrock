const { respond, mandateParam, logDeep, dateTimeFromNow, weeks } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const collabsFulfillmentsReview = async (
  region,
  {
    option,
  } = {},
) => {

  const shopifyFulfillmentOrdersResponse = await shopifyGet(
    region,
    'fulfillmentOrder',
    {
      attrs: `
        id
        fulfillments (first: 10) {
          edges {
            node {
              id
              name
              displayStatus
              requiresShipping
              trackingInfo (first: 10) {
                company
                number
                url
              }
            }
          }
        } 
      `,
      includeClosed: true,
      queries: [
        `createdAt:>${ dateTimeFromNow({ minus: weeks(1), dateOnly: true }) }`,
      ],
    },
  );

  logDeep(shopifyFulfillmentOrdersResponse);
  return shopifyFulfillmentOrdersResponse;
  
};

const collabsFulfillmentsReviewApi = async (req, res) => {
  const { 
    region,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'region', region),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await collabsFulfillmentsReview(
    region,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsFulfillmentsReview,
  collabsFulfillmentsReviewApi,
};

// curl localhost:8000/collabsFulfillmentsReview -H "Content-Type: application/json" -d '{ "region": "us" }'