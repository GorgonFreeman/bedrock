const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction, logDeep, askQuestion } = require('../utils');

const stylearcadeRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['stylearcade', credsPath]);
  const { 
    BASE_URL, 
    API_KEY, 
  } = creds;

  return {
    baseUrl: BASE_URL,
    headers: {
      Authorization: `Bearer ${ API_KEY }`,
    },
  };
};

const stylearcadeClient = new CustomAxiosClient({
  preparer: stylearcadeRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
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

const stylearcadeGetterPaginator = async (customAxiosPayload, response, additionalPaginationData) => {
  console.log('stylearcadeGetterPaginator', customAxiosPayload, response, additionalPaginationData);
  await askQuestion('Continue?');

  return [true, null];

  // Supplement payload with next pagination info
  // const paginatedPayload = {
  //   ...customAxiosPayload,
  //   params: {
  //     ...customAxiosPayload.params,
  //     // Add pagination parameters based on what the API expects
  //     ...(nextPage && { page: nextPage }),
  //     ...(nextCursor && { cursor: nextCursor }),
  //   },
  // };
  
  // Logic to determine done
  // const done = !hasNextPage;
  
  // return [done, paginatedPayload];
};

const stylearcadeGetterDigester = async (response) => {
  // logDeep('digester: get items from response', response);
  // await askQuestion('?');

  const { success, result: items } = response;
  if (!success || !items) { // Return if failed
    return null;
  }

  return items;
};

const stylearcadeGetter = async (
  {
    url,
    params,
    perPage = 100,
    context,
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
      paginator: stylearcadeGetterPaginator,
      digester: stylearcadeGetterDigester,
      client: stylearcadeClient,
      clientArgs: {
        context,
      },
      ...getterOptions,
    },
  );
};

const stylearcadeGet = getterAsGetFunction(stylearcadeGetter);

module.exports = {
  stylearcadeClient,
  stylearcadeGetter,
  stylearcadeGet,
};
