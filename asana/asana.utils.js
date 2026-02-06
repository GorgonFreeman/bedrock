const { CustomAxiosClient, credsByPath, askQuestion, logDeep, Getter, getterAsGetFunction } = require('../utils');

const asanaRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['asana', credsPath]);

  const { 
    BASE_URL,
    PERSONAL_ACCESS_TOKEN,
  } = creds;

  return {
    baseUrl: BASE_URL,
    headers: {
      'Authorization': `Bearer ${ PERSONAL_ACCESS_TOKEN }`,
    },
  };
};

const commonCreds = asanaRequestSetup();
const { baseUrl } = commonCreds;

const asanaClient = new CustomAxiosClient({
  baseUrl,
  preparer: asanaRequestSetup,
  baseInterpreter: async (response, context) => {
    
    const { resultsNode } = context;
    
    const { result } = response;
    let interpretedResult = result?.data ?? result;
    if (resultsNode) {
      interpretedResult = interpretedResult?.[resultsNode];
    }

    // Preserve pagination metadata (next_page) alongside the data
    const interpretedResponse = {
      ...response,
      ...response?.result && { 
        result: {
          data: interpretedResult,
          ...(result?.next_page && { next_page: result.next_page }),
        },
      },
    };

    // logDeep({ interpretedResponse });
    // await askQuestion('?');

    return interpretedResponse;
  },
});

const MAX_PER_PAGE = 100;

const asanaGetter = async (
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
          limit: Math.min(perPage, MAX_PER_PAGE),
          ...params,
        },
      },
      paginator: async (customAxiosPayload, response, additionalPaginationData) => {
        // logDeep('paginator', customAxiosPayload, response);
        // await askQuestion('continue?');

        const { success, result } = response;
        if (!success) {
          return [true, null];
        }

        // Extract pagination info from response
        const { next_page } = result || {};
        const offset = next_page?.offset;

        // Determine if we're done
        const done = !offset;

        // Supplement payload with next pagination info
        const paginatedPayload = {
          ...customAxiosPayload,
          params: {
            ...customAxiosPayload?.params,
            ...(offset ? { offset } : {}),
          },
        };

        return [done, paginatedPayload];
      },
      digester: async (response) => {
        // logDeep('digester', response);
        // await askQuestion('continue?');

        const { success, result } = response;
        if (!success) {
          return null;
        }

        const items = result?.data;
        return items;
      },
      client: asanaClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },
      ...getterOptions,
    },
  );
};

const asanaGet = getterAsGetFunction(asanaGetter);

module.exports = {
  asanaClient,
  asanaGetter,
  asanaGet,
};