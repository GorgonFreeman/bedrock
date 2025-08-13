// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/patchPickticketForId

const { respond, mandateParam, logDeep, actionMultipleOrSingle } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannPickticketCancelSingle = async (
  pickticketId,
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    method: 'patch',
    url: `/warehousing/picktickets/${ pickticketId }`,
    body: {
      status: 'CANCELLED',
    },
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const bleckmannPickticketCancel = async (
  pickticketId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    pickticketId,
    bleckmannPickticketCancelSingle,
    (pickticketId) => ({
      args: [pickticketId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const bleckmannPickticketCancelApi = async (req, res) => {
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

  const result = await bleckmannPickticketCancel(
    pickticketId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannPickticketCancel,
  bleckmannPickticketCancelApi,
};

// curl localhost:8000/bleckmannPickticketCancel -H "Content-Type: application/json" -d '{ "pickticketId": ... }'