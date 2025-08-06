// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/INVENTORY/getAdjustments

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannAsnsGet = async (
  createdFrom,
  createdTo,
  {
    credsPath,
    skip,
    perPage,
    ...getterOptions
  } = {},
) => {

  const response = await bleckmannGet(
    '/inventory/adjustments',
    {
      credsPath,
      params: {
        createdFrom,
        createdTo,
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
    createdFrom,
    createdTo,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'createdFrom', createdFrom),
    mandateParam(res, 'createdTo', createdTo),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannAsnsGet(
    createdFrom,
    createdTo,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannAsnsGet,
  bleckmannAsnsGetApi,
};

// curl localhost:8000/bleckmannAsnsGet -H "Content-Type: application/json" -d '{ "createdFrom": "2025-07-01T00:00:00+01:00", "createdTo": "2025-07-02T00:00:00+01:00" }'