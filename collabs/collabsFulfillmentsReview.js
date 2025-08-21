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
        orderId
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
      sortKey: 'UPDATED_AT',
      reverse: true,

      onItems: (items) => {
        fulfillmentOrders.push(...items);
      },
    },
  );

  const filteredFulfillmentOrders = [];

  const filterer = new Processor(
    fulfillmentOrders,
    async (pile) => {
      const fulfillmentOrder = pile.shift();
      filteredFulfillmentOrders.push(fulfillmentOrder);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
    },
  );

  const decider = new Processor(
    filteredFulfillmentOrders,
    async (pile) => {
      const fulfillmentOrder = pile.shift();
      logDeep(fulfillmentOrder);
      await askQuestion('?');
    },
    pile => pile.length === 0,
    {
      canFinish: false,
    },
  );

  getter.on('done', () => {
    filterer.canFinish = true;
  });

  filterer.on('done', () => {
    decider.canFinish = true;
  });

  const results = await Promise.all([
    getter.run(),
    filterer.run(),
    decider.run(),
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