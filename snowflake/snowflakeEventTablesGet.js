// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference

const { funcApi, logDeep } = require('../utils');
const { snowflakeGet, snowflakeGetter } = require('../snowflake/snowflake.utils');

// Payload maker function
const payloadMaker = (
  {
    credsPath,
    apiVersion = 'v2',

    // params

    // Used by pagination in snowflake.utils.js
    showLimit, // items per page
    fromName, // pagination cursor
  } = {},
) => {

  const params = {
    // params
    ...(showLimit && { showLimit }),
    ...(fromName && { fromName }),
  }

  return [
    `/api/${ apiVersion }/resourceName`,
    {
      params
    },
  ];
}

// Get function
const snowflakeEventTablesGet = async (...args) => {
  const response = await snowflakeGet(...payloadMaker(...args));
  return response;
};

// Getter function
// const snowflakeEventTablesGetter = async (...args) => {
//   const response = await snowflakeGetter(...payloadMaker(...args));
//   return response;
// };

const snowflakeEventTablesGetApi = funcApi(snowflakeEventTablesGet, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeEventTablesGet,
  snowflakeEventTablesGetApi,
};

// curl localhost:8000/snowflakeEventTablesGet
// curl localhost:8000/snowflakeEventTablesGet -H "Content-Type: application/json" -d '{ "options": {  } }'