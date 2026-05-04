// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/event-table

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
    ...(like && { like }),
    ...(startsWith && { startsWith }),
    ...(history && { history }),
    ...(showLimit && { showLimit }),
    ...(fromName && { fromName }),
  }

  return [
    `/api/${ apiVersion }/databases/${ databaseName }/schemas/${ schemaName }/event-tables`,
    {
      credsPath,
      apiVersion,
      params,
    },
  ];
}

// Get function
const snowflakeEventTablesGet = async (...args) => {
  const response = await snowflakeGet(...payloadMaker(...args));
  return response;
};

// Getter function
const snowflakeEventTablesGetter = async (...args) => {
  const response = await snowflakeGetter(...payloadMaker(...args));
  return response;
};

const snowflakeEventTablesGetApi = funcApi(snowflakeEventTablesGet, {
  argNames: ['databaseName', 'schemaName', 'options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeEventTablesGet,
  snowflakeEventTablesGetter,
  snowflakeEventTablesGetApi,
};

// curl localhost:8000/snowflakeEventTablesGet -H "Content-Type: application/json" -d '{ "databaseName": "AU_PRODUCTS", "schemaName": "SHOPIFY" }'
// curl localhost:8000/snowflakeEventTablesGet -H "Content-Type: application/json" -d '{ "databaseName": "AU_PRODUCTS", "schemaName": "SHOPIFY", "options": {  } }'