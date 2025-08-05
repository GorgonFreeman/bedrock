const { credsByPath, CustomAxiosClient, logDeep, Getter, getterAsGetFunction, askQuestion } = require('../utils');

const bleckmannRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['bleckmann', credsPath]);
  const { 
    BASE_URL,
    PRIMARY_KEY,
  } = creds;

  const headers = {
    'x-api-key': PRIMARY_KEY,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const commonCreds = bleckmannRequestSetup();
const { baseUrl } = commonCreds;

const bleckmannClient = new CustomAxiosClient({
  baseUrl,
  factory: bleckmannRequestSetup,
});

const bleckmannGetter = async (
  url,
  {
    credsPath,
    params,
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        params,
      },
      paginator: async (customAxiosPayload, response, { url }) => {
        logDeep(customAxiosPayload, response, url);
        await askQuestion('paginator?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return [true, null]; 
        }

        // 1. Extract necessary pagination info

        // 2. Supplement payload with next pagination info
        
        // 3. Logic to determine done
        
        return [done, customAxiosPayload, {
          url: nextUrl,
        }];

      },
      digester: async (response) => {
        // logDeep(response);
        // await askQuestion('digester?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return null; 
        }

        const items = result?.data;
        return items;
      },
      client: bleckmannClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },

      ...getterOptions
    },
  );
};

const bleckmannGet = getterAsGetFunction(bleckmannGetter);

module.exports = {
  bleckmannRequestSetup,
  bleckmannClient,
  bleckmannGetter,
  bleckmannGet,
};