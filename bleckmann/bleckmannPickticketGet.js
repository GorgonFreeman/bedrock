// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getPickticketForId

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannPickticketGet = async (
  pickticketId,
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
    pickticketId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'pickticketId', pickticketId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannPickticketGet(
    pickticketId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannPickticketGet,
  bleckmannPickticketGetApi,
};

// curl localhost:8000/bleckmannPickticketGet -H "Content-Type: application/json" -d '{ "pickticketId": "EXD1224-3-3XS/XXS" }'