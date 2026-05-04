// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/api-integration

// Named as IntegrationsGet because generateServable.js was removing the 'Api' from the function name.

const { funcApi, logDeep } = require('../utils');
const { snowflakeClient } = require('../snowflake/snowflake.utils');

const snowflakeIntegrationsGet = async (
  {
    credsPath,
    apiVersion = 'v2',

    like,
  } = {},
) => {

  const response = await snowflakeClient.fetch(
    {
      method: 'get',
      url: `/api/${ apiVersion }/api-integrations`,
      params: {
        ...(like && { like }),
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

const snowflakeIntegrationsGetApi = funcApi(snowflakeIntegrationsGet, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  snowflakeIntegrationsGet,
  snowflakeIntegrationsGetApi,
};

// curl localhost:8000/snowflakeIntegrationsGet
// curl localhost:8000/snowflakeIntegrationsGet -H "Content-Type: application/json" -d '{ "options": {  } }'