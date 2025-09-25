// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/INVENTORY/getAdjustments

const { funcApi, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const FUNC = async (
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['createdFrom', 'createdTo'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "createdFrom": "2025-07-01T00:00:00+01:00", "createdTo": "2025-07-02T00:00:00+01:00" }'