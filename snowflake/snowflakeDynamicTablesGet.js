// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/dynamic-table

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
    `/api/${ apiVersion }/databases/${ databaseName }/schemas/${ schemaName }/dynamic-tables`,
    {
      params
    },
  ];
}

// Get function
const snowflakeDynamicTablesGet = async (...args) => {
  const response = await snowflakeGet(...payloadMaker(...args));
  return response;
};

// Getter function
const snowflakeDynamicTablesGetter = async (...args) => {
  const response = await snowflakeGetter(...payloadMaker(...args));
  return response;
};

const snowflakeDynamicTablesGetApi = funcApi(snowflakeDynamicTablesGet, {
  argNames: ['databaseName', 'schemaName', 'options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeDynamicTablesGet,
  snowflakeDynamicTablesGetter,
  snowflakeDynamicTablesGetApi,
};

// curl localhost:8000/snowflakeDynamicTablesGet -H "Content-Type: application/json" -d '{ "databaseName": "AU_PRODUCTS", "schemaName": "SHOPIFY" }'
// curl localhost:8000/snowflakeDynamicTablesGet -H "Content-Type: application/json" -d '{ "databaseName": "AU_PRODUCTS", "schemaName": "SHOPIFY", "  options": {  } }'