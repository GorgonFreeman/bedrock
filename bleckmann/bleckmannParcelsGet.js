// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getParcels

const { respond, mandateParam, logDeep, customNullish } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannParcelsGet = async (
  pickticketId,
  {
    credsPath,
    includeDetails,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/warehousing/picktickets/${ pickticketId }/parcels`,
    params: {
      ...(!customNullish(includeDetails) && { includeDetails }),
    },
    context: {
      credsPath,
      resultsNode: 'data',
    },
  });

  logDeep(response);
  return response;
};

const bleckmannParcelsGetApi = async (req, res) => {
  const {
    pickticketId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'pickticketId', pickticketId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannParcelsGet(
    pickticketId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannParcelsGet,
  bleckmannParcelsGetApi,
};

// curl localhost:8000/bleckmannParcelsGet -H "Content-Type: application/json" -d '{ "pickticketId": "13075396002165" }'
// curl localhost:8000/bleckmannParcelsGet -H "Content-Type: application/json" -d '{ "pickticketId": "13073972003189", "options": { "perPage": 100 } }'