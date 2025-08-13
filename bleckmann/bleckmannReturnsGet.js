// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/RETURN/getReturns

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannReturnsGet = async (
  {
    credsPath,
    skip,
    perPage,
    // TODO: Consider consolidating 'from' and 'to' params into a single 'window' param, since they're often mutually required
    createdFrom,
    createdTo,
    receivedFrom,
    receivedTo,
    status,
    referencePickticketId,
    ...getterOptions
  } = {},
) => {

  const response = await bleckmannGet(
    '/warehousing/returns',
    {
      credsPath,
      params: {
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
        ...(receivedFrom && { receivedFrom }),
        ...(receivedTo && { receivedTo }),
        ...(status && { status }),
        ...(referencePickticketId && { referencePickticketId }),
        ...(skip && { skip }),
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const bleckmannReturnsGetApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'createdFrom', createdFrom),
  //   mandateParam(res, 'createdTo', createdTo),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await bleckmannReturnsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannReturnsGet,
  bleckmannReturnsGetApi,
};

// curl localhost:8000/bleckmannReturnsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 20, "perPage": 15 } }'