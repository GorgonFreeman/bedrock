// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/table

const { funcApi, logDeep } = require('../utils');
const { snowflakeGet, snowflakeGetter } = require('../snowflake/snowflake.utils');

// Payload maker function
const payloadMaker = (
  databaseName,
  schemaName,
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
    `/api/${ apiVersion }/databases/${ databaseName }/schemas/${ schemaName }/tables`,
    {
      params
    },
  ];
}

// Get function
const snowflakeTablesGet = async (...args) => {
  const response = await snowflakeGet(...payloadMaker(...args));
  return response;
};

// Getter function
const snowflakeTablesGetter = async (...args) => {
  const response = await snowflakeGetter(...payloadMaker(...args));
  return response;
};

const snowflakeTablesGetApi = funcApi(snowflakeTablesGet, {
  argNames: ['databaseName', 'schemaName', 'options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeTablesGet,
  snowflakeTablesGetter,
  snowflakeTablesGetApi,
};

// curl localhost:8000/snowflakeTablesGet -H "Content-Type: application/json" -d '{ "databaseName": "AU_PRODUCTS", "schemaName": "SHOPIFY" }'
// curl localhost:8000/snowflakeTablesGet -H "Content-Type: application/json" -d '{ "databaseName": "AU_PRODUCTS", "schemaName": "SHOPIFY", "options": {  } }'