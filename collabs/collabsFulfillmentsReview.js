const { respond, mandateParam, logDeep, dateTimeFromNow, weeks, Processor, askQuestion } = require('../utils');
const { shopifyGetter } = require('../shopify/shopify.utils');

const collabsFulfillmentsReview = async (
  region,
  {
    option,
  } = {},
) => {

  const fulfillmentOrders = [];
  
  const getter = await shopifyGetter(
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

      onItems: (items) => {
        fulfillmentOrders.push(...items);
      },
    },
  );

  const processor = new Processor(
    fulfillmentOrders,
    async (pile) => {
      const fulfillmentOrder = pile.shift();
      logDeep(fulfillmentOrder);
      await askQuestion('?');
    },
    pile => pile.length === 0,
    {
      canFinish: false,
    }
  );

  getter.on('done', () => {
    processor.canFinish = true;
  });

  const results = await Promise.all([
    getter.run(),
    processor.run(),
  ]);

  logDeep(results);
  return results;
  
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