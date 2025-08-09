const { credsByPath, customAxios } = require('../utils');

const loopRequestSetup = (credsPath) => {
  const creds = credsByPath(['loop', credsPath]);
  
  if (!creds.BASE_URL) {
    throw new Error('Loop BASE_URL is required');
  }
  
  if (!creds.API_KEY) {
    throw new Error('Loop API_KEY is required');
  }

  return {
    baseUrl: creds.BASE_URL,
    headers: {
      'Authorization': `Bearer ${ creds.API_KEY }`,
      'Content-Type': 'application/json',
    },
  };
};

const loopFactory = async (context) => {
  const { credsPath } = context;
  return loopRequestSetup(credsPath);
};

const loopClient = new (require('../utils').CustomAxiosClient)({
  factory: loopFactory,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

const loopGet = async (
  url,
  {
    credsPath,
    params,
    perPage,
    ...getterOptions
  } = {},
) => {
  return new (require('../utils').Getter)(
    {
      url,
      payload: {
        params,
      },
      paginator: async (customAxiosPayload, response, { resultsCount, lastPageResultsCount }) => {
        const { success, result } = response;
        if (!success) {
          return [true, null];
        }

        // Extract pagination info from response
        const { pagination } = result || {};
        const { current_page, total_pages } = pagination || {};

        // Determine if we're done
        const done = !pagination || current_page >= total_pages;

        // Prepare next page payload
        const paginatedPayload = {
          ...customAxiosPayload,
          params: {
            ...customAxiosPayload.params,
            page: current_page + 1,
          },
        };

        return [done, paginatedPayload];
      },
      digester: async (response) => {
        const { success, result } = response;
        if (!success) {
          return null;
        }

        // Extract items from response
        const items = result?.data || result?.returns || [];
        return Array.isArray(items) ? items : [items];
      },
      client: loopClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },
      ...getterOptions,
    },
  );
};

module.exports = {
  loopRequestSetup,
  loopFactory,
  loopClient,
  loopGet,
}; 