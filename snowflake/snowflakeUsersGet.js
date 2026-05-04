// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference

const { funcApi, logDeep } = require('../utils');
const { snowflakeClient } = require('../snowflake/snowflake.utils');

const snowflakeUsersGet = async (
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

const snowflakeUsersGetApi = funcApi(snowflakeUsersGet, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeUsersGet,
  snowflakeUsersGetApi,
};

// curl localhost:8000/snowflakeUsersGet
// curl localhost:8000/snowflakeUsersGet -H "Content-Type: application/json" -d '{ "options": {  } }'