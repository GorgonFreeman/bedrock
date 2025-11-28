// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getPickticketForId

const { respond, mandateParam, logDeep, objHasAny, standardInterpreters, actionMultipleOrSingle } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');
const { bleckmannPickticketsGet } = require('../bleckmann/bleckmannPickticketsGet');

const bleckmannPickticketGetSingle = async (
  {
    pickticketId,
    pickticketReference, // equivalent to Shopify ID
  },
  {
    credsPath,
  } = {},
) => {

  if (pickticketId) {
    const response = await bleckmannClient.fetch({
      url: `/warehousing/picktickets/${ pickticketId }`,
      context: {
        credsPath,
      },
    });

    logDeep(response);
    return response;
  }

  /* pickticketReference */
  // TODO: Check if pickticketReference was provided, for JS imports that don't get validated in the API wrapper
  const response = await bleckmannPickticketsGet({
    credsPath,
    reference: pickticketReference,
  });

  const singleResponse = standardInterpreters.expectOne(response);

  // logDeep(singleResponse);
  return singleResponse;
  /* /pickticketReference */
};

const bleckmannPickticketGet = async (
  pickticketIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  return actionMultipleOrSingle(
    pickticketIdentifier, 
    bleckmannPickticketGetSingle, 
    (pickticketIdentifier) => ({
      args: [pickticketIdentifier],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const bleckmannPickticketGetApi = async (req, res) => {
  const { 
    pickticketIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'pickticketIdentifier', pickticketIdentifier, p => objHasAny(p, ['pickticketId', 'pickticketReference'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannPickticketGet(
    pickticketIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannPickticketGet,
  bleckmannPickticketGetApi,
};

// curl localhost:8000/bleckmannPickticketGet -H "Content-Type: application/json" -d '{ "pickticketIdentifier": { "pickticketId": "13017998197109" } }'
// curl localhost:8000/bleckmannPickticketGet -H "Content-Type: application/json" -d '{ "pickticketIdentifier": { "pickticketReference": "12091628323189" } }'
// curl localhost:8000/bleckmannPickticketGet -H "Content-Type: application/json" -d '{ "pickticketIdentifier": [{ "pickticketReference": "12094721622389" }, { "pickticketReference": "12095146164597" }, { "pickticketReference": "12089134252405" }] }'