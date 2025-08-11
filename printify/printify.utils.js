const { credsByPath, CustomAxiosClient, Getter, logDeep, askQuestion, getterAsGetFunction, CustomAxiosClientV2 } = require('../utils');

const printifyRequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['printify', credsPath]);
  // console.log(creds);

  const { 
    API_KEY,
    BASE_URL,
  } = creds;

  const headers = {
    'Authorization': `Bearer ${ API_KEY }`,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

// get base url for use in client
const commonCreds = printifyRequestSetup();
const { baseUrl } = commonCreds;

const printifyClient = new CustomAxiosClientV2({
  baseUrl,
  preparer: printifyRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

const printifyGetterPaginator = async (customAxiosPayload, response, additionalPaginationData) => {
  // logDeep('paginator: decide when done and make next payload', customAxiosPayload, response);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }

  // 1. Extract necessary pagination info
  const { 
    current_page: currentPage, 
    last_page: lastPage,
  } = result;

  // 2. Supplement payload with next pagination info
  const paginatedPayload = {
    ...customAxiosPayload,
    params: {
      ...customAxiosPayload?.params,
      page: currentPage + 1,
    },
  };
  
  // 3. Logic to determine done
  const done = currentPage === lastPage;
  
  return [done, paginatedPayload];
};

const printifyGetterDigester = async (response) => {
  // logDeep('digester: get items from response', response);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return null; 
  }

  const items = result?.data;
  return items;
};

const printifyGetter = async (
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
      paginator: printifyGetterPaginator,
      digester: printifyGetterDigester,

      client: printifyClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },

      ...getterOptions
    },
  );
};

const printifyGet = getterAsGetFunction(printifyGetter);

module.exports = {
  printifyClient,
  printifyGetter,
  printifyGet,
};