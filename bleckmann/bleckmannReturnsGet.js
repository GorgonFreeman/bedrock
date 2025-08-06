// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/RETURN/getReturns

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannReturnsGet = async (
  {
    credsPath,
    skip,
    perPage,
    createdFrom,
    createdTo,
    ...getterOptions
  } = {},
) => {

  const response = await bleckmannGet(
    '/events',
    {
      credsPath,
      params: {
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
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

// curl localhost:8000/bleckmannReturnsGet -H "Content-Type: application/json" -d '{ "createdFrom": "2025-07-01T00:00:00+01:00", "createdTo": "2025-07-02T00:00:00+01:00" }'