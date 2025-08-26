const { credsByPath, CustomAxiosClient, logDeep, askQuestion, Getter, getterAsGetFunction } = require('../utils');

const slackRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['slack', credsPath]);
  const { 
    BASE_URL,
    BOT_TOKEN,
  } = creds;

  const headers = {
    'Authorization': `Bearer ${ BOT_TOKEN }`,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const commonCreds = slackRequestSetup();
const { baseUrl } = commonCreds;

const slackClient = new CustomAxiosClient({
  baseUrl,
  preparer: slackRequestSetup,
  headers: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: (response) => {
    const { success, result } = response;
    if (!success) { // Return if failed
      return response;
    }

    const { ok, ...rest } = result;
    
    if (!ok) {
      return {
        success: false,
        error: [rest],
      };
    }

    return {
      success: true,
      result: rest,
    };
  },
});

const slackGetter = async (
  url,
  {
    credsPath,
    params,
    perPage, // Not supplying perPage results in Slack attempting to return the entire results - but we may get an error.
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        params: {
          ...params,
          ...(perPage ? { limit: perPage } : {}),
        },
      },
      paginator: async (customAxiosPayload, response, { lastPageResultsCount }) => {
        logDeep(customAxiosPayload, response, lastPageResultsCount);
        await askQuestion('paginator?');
      },
      digester: async (response) => {
        logDeep(response);
        await askQuestion('digester?');
      },
      client: slackClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },

      ...getterOptions
    },
  );
};

const slackGet = getterAsGetFunction(slackGetter);

module.exports = {
  slackClient,
  slackGetter,
  slackGet,
};