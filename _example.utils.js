const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction, askQuestion } = require('../utils');

// Takes context
const PLATFORMRequestSetup = async ({ credsPath } = {}) => {
  const creds = credsByPath(['PLATFORM', credsPath]);
  const {
    BASE_URL,
    API_KEY,
  } = creds;

  const headers = {
    'x-api-key': API_KEY,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const commonCreds = PLATFORMRequestSetup();
const { baseUrl } = commonCreds;

const PLATFORMClient = new CustomAxiosClient({
  requiredContext: ['credsPath'],
  baseUrl,
  preparer: PLATFORMRequestSetup,
});

const PLATFORMPaginator = async (customAxiosPayload, response, additionalPaginationData) => {
  console.log('PLATFORMPaginator', customAxiosPayload, response, additionalPaginationData);
  await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }
  
  // 1. Extract necessary pagination info

  // const { 
  //   current_page: currentPage, 
  //   next_page: nextPage,
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

  // const done = !nextPage || nextPage === null || nextPage === 'null';

  // return [done, paginatedPayload];
};

const PLATFORMDigester = async (response) => {
  console.log('PLATFORMDigester', response);
  await askQuestion('?');

  // return response?.result?.result;
};

const PLATFORMGetter = (
  credsPath,
  url,
  {
    params,
    ...getterOptions
  } = {},
) => {

  const context = {
    credsPath,
  }
  return new Getter({
    url,
    payload: {
      params,
    },

    paginator: PLATFORMPaginator,
    digester: PLATFORMDigester,

    client: PLATFORMClient,
    clientArgs: {
      context,
    },

    ...getterOptions
  });
};  

const PLATFORMGet = getterAsGetFunction(PLATFORMGetter);

module.exports = {
  PLATFORMClient,
  PLATFORMGetter,
  PLATFORMGet,
};