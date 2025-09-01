const { credsByPath, CustomAxiosClient, logDeep, Getter, getterAsGetFunction, askQuestion } = require('../utils');
const { MAX_PER_PAGE } = require('../bleckmann/bleckmann.constants');

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
  preparer: bleckmannRequestSetup,
  baseInterpreter: (response, context) => {
    const { resultsNode } = context;

    if (!resultsNode) {
      return response;
    }

    return {
      ...response,
      ...response?.result && { result: response.result?.[resultsNode] },
    };
  },
});

const bleckmannGetter = async (
  url,
  {
    credsPath,
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
          ...params,
          limit: perPage,
        },
      },
      paginator: async (customAxiosPayload, response, { lastPageResultsCount }) => {
        // logDeep(customAxiosPayload, response, lastPageResultsCount);
        // await askQuestion('paginator?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return [true, null]; 
        }

        // 1. Extract necessary pagination info

        // 2. Supplement payload with next pagination info
        const paginatedPayload = {
          ...customAxiosPayload,
          params: {
            ...customAxiosPayload.params,
            skip: (customAxiosPayload.params?.skip || 0) + lastPageResultsCount,
          },
        };
        
        // 3. Logic to determine done
        const done = lastPageResultsCount === 0;
        
        return [done, paginatedPayload];

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

const bleckmannNowTime = () => {
  return new Date().toISOString().slice(0, 19) + 'Z';
};

module.exports = {
  bleckmannRequestSetup,
  bleckmannClient,
  bleckmannGetter,
  bleckmannGet,
  bleckmannNowTime,
};