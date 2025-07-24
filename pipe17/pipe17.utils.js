const { credsByPath, CustomAxiosClient, logDeep, askQuestion, Getter, getterAsGetFunction } = require('../utils');

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

const pipe17Client = new CustomAxiosClient({
  factory: pipe17RequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

const pipe17GetterPaginator = async (customAxiosPayload, response) => {
  logDeep('paginator: decide when done and make next payload', customAxiosPayload, response);
  await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }

  // 1. Extract necessary pagination info
  // const { 
  //   current_page: currentPage, 
  //   last_page: lastPage,
  // } = result;

  // 2. Supplement payload with next pagination info
  // const paginatedPayload = {
  //   ...customAxiosPayload,
  //   params: {
  //     ...customAxiosPayload?.params,
  //     page: currentPage + 1,
  //   },
  // };
  
  // 3. Logic to determine done
  // const done = currentPage === lastPage;
  
  return [done, paginatedPayload];
};

const pipe17GetterDigester = async (response) => {
  // logDeep('digester: get items from response', response);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }

  // const items = result?.data;
  // return items;
};

const pipe17Getter = async (
  url,
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
      digester: pipe17GetterDigester,

      client: pipe17Client,
      clientArgs: {
        factoryArgs: [credsPath],
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