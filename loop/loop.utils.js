const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction } = require('../utils');

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
  factory: loopRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

const loopGetter = async (
  credsPath,
  url,
  {
    params,
    perPage,
    ...getterOptions
  } = {},
) => {
  return new Getter(
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

const loopGet = getterAsGetFunction(loopGetter);

module.exports = {
  loopRequestSetup,
  loopClient,
  loopGetter,
  loopGet,
}; 