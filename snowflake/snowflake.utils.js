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
        params: {
          showLimit: 100, // Default show limit
          ...params,
        },

      },
      paginator: async (customAxiosPayload, response) => {
        // logDeep(customAxiosPayload, response);
        // await askQuestion('paginator?');

        // 1. Fetch limit from params
        const { params } = customAxiosPayload;
        const { showLimit } = params;

        // 2. Complete pagination if there are less items than the limit
        if (response.result.length < showLimit) {
          return [true, customAxiosPayload];
        }

        // 3. Determine last name of item in list
        const lastName = response.result[response.result.length - 1].name;

        // 4. Paginate to next page by name
        return [false, { ...customAxiosPayload, params: { ...params, fromName: lastName } }];
      },
      digester: async (response) => {
        // logDeep(response);
        // await askQuestion('digester?');

        // 1. Check success
        const { success, result } = response;
        if (!success) {
          return null;
        }

        // 2. Compile items from result
        const items = result;
        return items;
      },
      client: snowflakeClient,
      clientArgs: {
        context: {
          credsPath,
        },
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