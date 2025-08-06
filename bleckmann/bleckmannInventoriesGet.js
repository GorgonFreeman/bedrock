// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/INVENTORY/getInventory

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannInventoriesGet = async (
  {
    credsPath,
    skip,
    perPage,
    ...getterOptions
  } = {},
) => {

  const response = await bleckmannGet(
    '/inventory',
    {
      credsPath,
      params: {
        ...(skip && { skip }),
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const bleckmannInventoriesGetApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await bleckmannInventoriesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannInventoriesGet,
  bleckmannInventoriesGetApi,
};

// curl localhost:8000/bleckmannInventoriesGet
// curl localhost:8000/bleckmannInventoriesGet -H "Content-Type: application/json" -d '{ "options": { "limit": 100, "perPage": 35 } }'