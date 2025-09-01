// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getParcels

const { respond, mandateParam, logDeep, customNullish } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');
const { bleckmannPickticketGet } = require('../bleckmann/bleckmannPickticketGet');

const bleckmannParcelsGet = async (
  {
    pickticketId,
    pickticketReference,
  },
  {
    credsPath,
    includeDetails,
  } = {},
) => {

  if (!pickticketId) {
    const pickticketResponse = await bleckmannPickticketGet({ pickticketReference }, { credsPath });
    const { success, result: pickticket } = pickticketResponse;
    if (!success) {
      return pickticketResponse;
    }
    pickticketId = pickticket.pickticketId;
  }

  if (!pickticketId) {
    return {
      success: false,
      error: ['Pickticket not found by reference'],
    };
  }

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
    pickticketIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'pickticketIdentifier', pickticketIdentifier, p => objHasAny(p, ['pickticketId', 'pickticketReference'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannParcelsGet(
    pickticketIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannParcelsGet,
  bleckmannParcelsGetApi,
};

// curl localhost:8000/bleckmannParcelsGet -H "Content-Type: application/json" -d '{ "pickticketIdentifier": { "pickticketId": "13075396002165" } }'
// curl localhost:8000/bleckmannParcelsGet -H "Content-Type: application/json" -d '{ "pickticketIdentifier": { "pickticketReference": "12145428431221" } }'