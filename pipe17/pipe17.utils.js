const { credsByPath, CustomAxiosClientV2, logDeep, askQuestion, Getter, getterAsGetFunction } = require('../utils');

const pipe17RequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['pipe17', credsPath]);
  // console.log(creds);

  const { 
    API_KEY,
    BASE_URL,
  } = creds;

  const headers = {
    'X-Pipe17-Key': API_KEY,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const pipe17Client = new CustomAxiosClientV2({
  preparer: pipe17RequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: (response) => {

    if (!response?.result?.success) {
      return {
        success: false,
        error: [response.result],
      };
    }

    return response;
  },
});

const pipe17GetterPaginator = async (customAxiosPayload, response) => {
  // logDeep('paginator: decide when done and make next payload', customAxiosPayload, response);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }

  // 1. Extract necessary pagination info
  const { pagination } = result;
  const { last, pageSize } = pagination;

  // console.log(last, pageSize, customAxiosPayload?.params);
  // await askQuestion('?');

  // 2. Supplement payload with next pagination info
  const paginatedPayload = {
    ...customAxiosPayload,
    params: {
      ...customAxiosPayload?.params,
      skip: (customAxiosPayload?.params?.skip || 0) + pageSize,
    },
  };
  
  // 3. Logic to determine done
  const done = last;
  
  return [done, paginatedPayload];
};

const pipe17GetterDigester = async (response, itemsNodeName) => {
  // logDeep('digester: get items from response', response);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }

  const items = result?.[itemsNodeName];
  return items;
};

const pipe17Getter = async (
  url,
  itemsNodeName,
  {
    credsPath,
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
      paginator: pipe17GetterPaginator,
      digester: (response) => pipe17GetterDigester(response, itemsNodeName),

      client: pipe17Client,
          clientArgs: {
      context: {
        credsPath,
      },
    },

      ...getterOptions
    },
  );
};

const pipe17Get = getterAsGetFunction(pipe17Getter);

module.exports = {
  pipe17Client,
  pipe17Getter,
  pipe17Get,
};