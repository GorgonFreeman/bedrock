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

  const { success, result } = response;
  if (!success || !result) { // Return if failed
    return [true, null];
  }

  logDeep(result);

  const { nextCursor } = result;

  // Supplement payload with next pagination info
  const paginatedPayload = {
    ...customAxiosPayload,
    params: {
      ...customAxiosPayload.params,
      ...(nextCursor && { cursor: nextCursor }),
    },
  };

  logDeep(paginatedPayload);
  
  // Logic to determine done
  const done = !nextCursor;
  
  return [done, paginatedPayload];
};

const stylearcadeGetterDigester = async (response, resultsNode) => {
  logDeep('digester: get items from response', response, resultsNode);
  await askQuestion('?');

  const { success, result } = response;
  if (!success || !result) { // Return if failed
    return null;
  }

  const items = result?.[resultsNode];
  console.log('items', items?.length);

  return items;
};

const stylearcadeGetter = async (
  {
    url,
    params,
    perPage = 100,
    context,
    resultsNode,
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
      digester: (response) => stylearcadeGetterDigester(response, resultsNode),
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
