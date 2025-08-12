const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction, logDeep, askQuestion } = require('../utils');
const { MAX_PER_PAGE } = require('../loop/loop.constants');

const loopRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['loop', credsPath]);

  const { BASE_URL, API_KEY } = creds;
  
  if (!BASE_URL) {
    throw new Error('Loop BASE_URL is required');
  }

  return {
    baseUrl: BASE_URL,
    headers: {
      'X-Authorization': API_KEY,
    },
  };
};

const loopClient = new CustomAxiosClient({
  requiredContext: ['credsPath'],
  preparer: loopRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

const loopGetter = async (
  credsPath,
  url,
  nodeName,
  {
    params,
    perPage = MAX_PER_PAGE,
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        params: {
          paginate: true,
          pageSize: perPage,
          ...params,
        },
      },
      paginator: async (customAxiosPayload, response, { resultsCount, lastPageResultsCount }) => {
        // logDeep('paginator', nodeName, customAxiosPayload, response);
        // askQuestion('continue?');

        const { success, result } = response;
        if (!success) {
          return [true, null];
        }

        // Extract pagination info from response
        const { nextPageUrl } = result || {};

        // Determine if we're done
        const done = !nextPageUrl;


        return [done, customAxiosPayload, {
          url: nextPageUrl,
        }];
      },
      digester: async (response) => {
        logDeep('digester', response);
        askQuestion('continue?');
        return response?.result?.[nodeName];
      },
      client: loopClient,
      clientArgs: {
        context: {
          credsPath,
          nodeName,
        },
      },
      ...getterOptions,
    },
  );
};

const loopGet = getterAsGetFunction(loopGetter);

module.exports = {
  loopRequestSetup,
  loopClient,
  loopGetter,
  loopGet,
}; 