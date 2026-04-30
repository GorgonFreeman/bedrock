// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/database

const { funcApi, logDeep } = require('../utils');
const { snowflakeGet, snowflakeGetter } = require('../snowflake/snowflake.utils');

// Payload maker function
const payloadMaker = (
  {
    credsPath,
    apiVersion = 'v2',
    
    like,
    startsWith,
    showLimit,
    fromName,
    history,
  } = {},
) => {
  const params = {
    ...(like && { like }),
    ...(startsWith && { startsWith }),
    ...(showLimit && { showLimit }),
    ...(fromName && { fromName }),
    ...(history && { history }),
  }

  return [
    `/api/${ apiVersion }/resourceName`,
    {
      params
    },
  ];
}

const snowflakeDatabasesGet = async (...args) => {
  const response = await snowflakeGet(...payloadMaker(...args));
  return response;
};

const snowflakeDatabasesGetter = async (...args) => {
  const response = await snowflakeGetter(...payloadMaker(...args));
  return response;
};

const snowflakeDatabasesGetApi = funcApi(snowflakeDatabasesGet, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeDatabasesGet,
  snowflakeDatabasesGetter,
  snowflakeDatabasesGetApi,
};

// curl localhost:8000/snowflakeDatabasesGet
// curl localhost:8000/snowflakeDatabasesGet -H "Content-Type: application/json" -d '{ "options": {  } }'