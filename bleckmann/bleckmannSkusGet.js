const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannSkusGet = async (
  {
    credsPath,
    skip,
    perPage,
    createdFrom,
    createdTo,
    ...getterOptions
  } = {},
) => {

  if (createdFrom && !createdTo) {
    createdTo = new Date().toISOString();
  }

  const response = await bleckmannGet(
    '/skus',
    {
      credsPath,
      params: {
        ...(skip && { skip }),
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const bleckmannSkusGetApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await bleckmannSkusGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannSkusGet,
  bleckmannSkusGetApi,
};

// curl localhost:8000/bleckmannSkusGet
// curl localhost:8000/bleckmannSkusGet -H "Content-Type: application/json" -d '{ "options": { "limit": 100 } }'
// curl localhost:8000/bleckmannSkusGet -H "Content-Type: application/json" -d '{ "options": { "createdFrom": "2024-01-01T00:00:00+01:00" } }'