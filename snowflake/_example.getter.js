https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference

const { funcApi, logDeep } = require('../utils');
const { snowflakeGet, snowflakeGetter } = require('../snowflake/snowflake.utils');

// Payload maker function
const payloadMaker = (
  {
    credsPath,
    apiVersion = 'v2',

    // params
    ...params
  } = {},
) => {

  const params = {
    // params
  }

  return [
    `/api/${ apiVersion }/resourceName`,
    {
      params
    },
  ];
}

// Get function
const FUNC = async (...args) => {
  const response = await snowflakeGet(...payloadMaker(...args));
  return response;
};

// Getter function
// const FUNCter = async (...args) => {
//   const response = await snowflakeGetter(...payloadMaker(...args));
//   return response;
// };

const FUNCApi = funcApi(FUNC, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC
// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "options": {  } }'