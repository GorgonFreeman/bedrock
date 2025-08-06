// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/INVENTORY/getAdjustments

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannInventoryAdjustmentsGet = async (
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
    '/inventory/adjustments',
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

const bleckmannInventoryAdjustmentsGetApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await bleckmannInventoryAdjustmentsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannInventoryAdjustmentsGet,
  bleckmannInventoryAdjustmentsGetApi,
};

// curl localhost:8000/bleckmannInventoryAdjustmentsGet