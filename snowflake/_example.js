// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference

const { funcApi, logDeep } = require('../utils');
const { snowflakeClient } = require('../snowflake/snowflake.utils');

const FUNC = async (
  {
    credsPath,
    apiVersion = 'v2',

    // params
  } = {},
) => {

  const response = await snowflakeClient.fetch(
    {
      method: 'get',
      url: `/api/${ apiVersion }/resourceName`,
      params: {
        // params
      },
      context: {
        credsPath,
        apiVersion,
      },
    },
  );
  // logDeep(response);
  return response;
};

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