const { credsByPath, CustomAxiosClient, Getter, logDeep, askQuestion, getterAsGetFunction } = require('../utils');
const { logiwaAuthGet } = require('../logiwa/logiwaAuthGet');

const logiwaRequestSetup = ({ credsPath, apiVersion = 'v3.1' } = {}) => {

  const creds = credsByPath(['logiwa', credsPath]);

  const { 
    BASE_URL,
  } = creds;

  return {
    baseUrl: `${ BASE_URL }/${ apiVersion }`,
  };
};

const logiwaFactory = async({ credsPath, apiVersion } = {}) => {
  // TODO: Consider storing auth token in memory/Upstash
  const { baseUrl } = logiwaRequestSetup({ credsPath, apiVersion });

  const authResponse = await logiwaAuthGet({ credsPath, apiVersion });
  if (!authResponse?.success) {
    throw new Error(authResponse);
  }
  const authToken = authResponse?.result;

  const headers = {
    Authorization: `Bearer ${ authToken }`,
  };

  return {
    baseUrl,
    headers,
  };
};

const logiwaClient = new CustomAxiosClient({
  baseUrl: logiwaRequestSetup().baseUrl,
  factory: logiwaFactory,
});

const logiwaGetter = async (
  url,
  {
    credsPath,
    apiVersion,
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
      paginator: async (customAxiosPayload, response) => {
        logDeep(response);
        await askQuestion('paginator?');
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
      client: logiwaClient,
      clientArgs: {
        context: {
          credsPath,
          apiVersion,
        },
      },

      ...getterOptions
    },
  );
};

const logiwaGet = getterAsGetFunction(logiwaGetter);

module.exports = {
  logiwaClient,
  logiwaGetter,
  logiwaGet,
};