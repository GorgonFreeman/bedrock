const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction } = require('../utils');
const { MAX_PER_PAGE } = require('../workable/workable.constants');

const workableRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['workable', credsPath]);

  const {
    BASE_URL,
    ACCESS_TOKEN,
  } = creds;

  return {
    baseUrl: BASE_URL,
    headers: {
      'Authorization': `Bearer ${ ACCESS_TOKEN }`,
    },
  };
};

const commonCreds = workableRequestSetup();
const { baseUrl } = commonCreds;

const workableClient = new CustomAxiosClient({
  baseUrl,
  preparer: workableRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const workableGetter = async (
  url,
  {
    credsPath,
    params,
    perPage = MAX_PER_PAGE,
    resultsKey,
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
      paginator: async (customAxiosPayload, response) => {
        const { success, result } = response;
        if (!success) {
          return [true, null];
        }

        const nextUrl = result?.paging?.next;
        const done = !nextUrl;

        if (done) {
          return [true, null];
        }

        // Extract query params from the next URL and merge into payload
        const parsedNext = new URL(nextUrl);
        const nextParams = Object.fromEntries(parsedNext.searchParams.entries());

        const paginatedPayload = {
          ...customAxiosPayload,
          params: {
            ...customAxiosPayload?.params,
            ...nextParams,
          },
        };

        return [false, paginatedPayload];
      },
      digester: async (response) => {
        const { success, result } = response;
        if (!success) {
          return null;
        }

        // Use explicit resultsKey, or find the first array-valued property
        if (resultsKey) {
          return result?.[resultsKey];
        }

        const arrayEntry = Object.entries(result || {}).find(([, v]) => Array.isArray(v));
        return arrayEntry ? arrayEntry[1] : [];
      },
      client: workableClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },
      ...getterOptions,
    },
  );
};

const workableGet = getterAsGetFunction(workableGetter);

module.exports = {
  workableClient,
  workableGetter,
  workableGet,
};
