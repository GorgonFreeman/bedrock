// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getPickticketForId

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannPickticketGet = async (
  {
    pickticketId,
    pickticketReference, // equivalent to Shopify ID
  },
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/warehousing/picktickets/${ pickticketId }`,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
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