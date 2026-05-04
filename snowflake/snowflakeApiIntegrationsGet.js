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
const snowflakeApiIntegrationsGet = async (...args) => {
  const response = await snowflakeGet(...payloadMaker(...args));
  return response;
};

// Getter function
// const snowflakeApiIntegrationsGetter = async (...args) => {
//   const response = await snowflakeGetter(...payloadMaker(...args));
//   return response;
// };

const snowflakeApiIntegrationsGetApi = funcApi(snowflakeApiIntegrationsGet, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeApiIntegrationsGet,
  snowflakeApiIntegrationsGetApi,
};

// curl localhost:8000/snowflakeApiIntegrationsGet
// curl localhost:8000/snowflakeApiIntegrationsGet -H "Content-Type: application/json" -d '{ "options": {  } }'