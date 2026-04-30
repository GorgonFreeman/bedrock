const { CustomAxiosClient, credsByPath, Getter, getterAsGetFunction, logDeep, askQuestion } = require('../utils');
const { snowflakeAuthGet } = require('../snowflake/snowflakeAuthGet');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');

const AUTH_TOKENS = new Map();

const snowflakeRequestSetup = ({ credsPath = 'default' } = {}) => {
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

  let authToken;
  const upstashKey = `snowflake_token_${ credsPath?.join('.') || 'default' }`;

  if (AUTH_TOKENS.has(credsPath)) {
    authToken = AUTH_TOKENS.get(credsPath);
    // console.log('Using auth token from map');
  }

  if (!authToken) {
    const authResponse = await snowflakeAuthGet({ credsPath });
    const { success: authResponseSuccess, result: authResponseResult } = authResponse;
    if (!authResponseSuccess) {
      throw new Error(authResponse);
    }
    const { access_token: authToken } = authResponseResult;
    AUTH_TOKENS.set(credsPath, authToken);
    upstashSet(upstashKey, authToken);
    console.log('Using auth token from API');
  }

  return {
    baseUrl,
    headers: { Authorization: `Bearer ${ authToken }` },
  };

};

const snowflakeClient = new CustomAxiosClient({
  baseUrl,
  preparer: snowflakeFactory,
});

const snowflakeGetter = async (
  url,
  {
    credsPath,
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