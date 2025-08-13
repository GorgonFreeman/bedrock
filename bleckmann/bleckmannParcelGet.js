// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getParcelForId

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannParcelGet = async (
  pickticketId,
  parcelId,
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/warehousing/picktickets/${ pickticketId }/parcels/${ parcelId }`,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const bleckmannParcelGetApi = async (req, res) => {
  const { 
    pickticketId,
    parcelId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'pickticketId', pickticketId),
    mandateParam(res, 'parcelId', parcelId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannParcelGet(
    pickticketId,
    parcelId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannParcelGet,
  bleckmannParcelGetApi,
};

// curl localhost:8000/bleckmannParcelGet -H "Content-Type: application/json" -d '{ "pickticketId": ..., "parcelId": ... }'