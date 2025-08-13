// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/ASN/getAsns

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannAsnsGet = async (
  {
    credsPath,
    skip,
    perPage,
    createdFrom,
    createdTo,
    receivedFrom,
    receivedTo,
    status,
    ...getterOptions
  } = {},
) => {

  const response = await bleckmannGet(
    '/warehousing/asns',
    {
      credsPath,
      params: {
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
        ...(receivedFrom && { receivedFrom }),
        ...(receivedTo && { receivedTo }),
        ...(status && { status }),
        ...(skip && { skip }),
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const bleckmannAsnsGetApi = async (req, res) => {
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

  const result = await bleckmannAsnsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannAsnsGet,
  bleckmannAsnsGetApi,
};

// curl localhost:8000/bleckmannAsnsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 20, "perPage": 15 } }'