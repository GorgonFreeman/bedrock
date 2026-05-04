// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/schema

const { funcApi, logDeep } = require('../utils');
const { snowflakeGet, snowflakeGetter } = require('../snowflake/snowflake.utils');

// Payload maker function
const payloadMaker = (
  databaseName,
  {
    credsPath,
    apiVersion = 'v2',

    like,
    startsWith,
    history,

    // Used by pagination in snowflake.utils.js
    showLimit, // items per page
    fromName, // pagination cursor
  } = {},
) => {

  const params = {
    // params
    ...(like && { like }),
    ...(startsWith && { startsWith }),
    ...(history && { history }),
    ...(showLimit && { showLimit }),
    ...(fromName && { fromName }),
  }

  return [
    `/api/${ apiVersion }/databases/${ databaseName }/schemas`,
    {
      credsPath,
      apiVersion,
      params,
    },
  ];
}

// Get function
const snowflakeSchemasGet = async (...args) => {
  const response = await snowflakeGet(...payloadMaker(...args));
  return response;
};

// Getter function
const snowflakeSchemasGetter = async (...args) => {
  const response = await snowflakeGetter(...payloadMaker(...args));
  return response;
};

const snowflakeSchemasGetApi = funcApi(snowflakeSchemasGet, {
  argNames: ['databaseName', 'options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeSchemasGet,
  snowflakeSchemasGetter,
  snowflakeSchemasGetApi,
};

// curl localhost:8000/snowflakeSchemasGet -H "Content-Type: application/json" -d '{ "databaseName": "AU_PRODUCTS" }'
// curl localhost:8000/snowflakeSchemasGet -H "Content-Type: application/json" -d '{ "databaseName": "AU_PRODUCTS", "options": {  } }'