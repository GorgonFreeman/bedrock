const { CustomAxiosClient, credsByPath, Getter, getterAsGetFunction, logDeep, askQuestion } = require('../utils');
const { snowflakeAuthGet } = require('../snowflake/snowflakeAuthGet');

const AUTH_TOKENS = new Map();

const snowflakeRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['snowflake', credsPath]);

  const {
    BASE_URL,
  } = creds;

  return {
    baseUrl: BASE_URL,
  };
};

const snowflakeFactory = async(
  {
    credsPath,
  } = {},
) => {
  const { baseUrl } = snowflakeRequestSetup({ credsPath });

  const authGetResponse = await snowflakeAuthGet({ credsPath });
  if (!authGetResponse?.success) {
    throw new Error(authGetResponse);
  }
  const { accessToken } = authGetResponse?.result;

  return {
    baseUrl,
    headers: { Authorization: `Bearer ${ accessToken }` },
  };

};

const snowflakeClient = new CustomAxiosClient({
  baseUrl: snowflakeRequestSetup().baseUrl,
  preparer: snowflakeFactory,
});

const snowflakeGetter = async (
  url,
  {
    credsPath,
    apiVersion = 'v2',
    params,
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        method: 'get',
      },
      paginator: async (customAxiosPayload, response, { url }) => {
        const { success, result } = response;
        if (!success) {
          return [true, null];
        }
        return [false, customAxiosPayload, { url }];
      },
      digester: async (response) => {
        const { success, result } = response;
        if (!success) {
          return null;
        }
        return result;
      },
      client: snowflakeClient,
      clientArgs: {
        context: { credsPath },
      },
      ...getterOptions,
    },
  );
};

const snowflakeGet = getterAsGetFunction(snowflakeGetter);

module.exports = {
  snowflakeClient,
  snowflakeGetter,
  snowflakeGet,
};