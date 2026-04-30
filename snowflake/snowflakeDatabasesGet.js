const { funcApi, logDeep } = require('../utils');
const { snowflakeGetter } = require('../snowflake/snowflake.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const snowflakeDatabasesGet = async (
  {
    credsPath,
    apiVersion = 'v3.1',

    page = 0,
    perPage = MAX_PER_PAGE,

    ...getterOptions
  } = {},
) => {

  const response = await logiwaGet(
    `/Product/list/i/${ page }/s/${ perPage }`,
    {
      credsPath,
      apiVersion,
      // params,
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const snowflakeDatabasesGetApi = funcApi(snowflakeDatabasesGet, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeDatabasesGet,
  snowflakeDatabasesGetApi,
};

// curl localhost:8000/snowflakeDatabasesGet
// curl localhost:8000/snowflakeDatabasesGet -H "Content-Type: application/json" -d '{ "options": { "limit": 10 } }'