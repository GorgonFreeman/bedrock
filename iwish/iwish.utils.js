const { credsByPath, CustomAxiosClientV2, Getter, getterAsGetFunction, askQuestion } = require('../utils');

const iwishRequestSetup = async ({ credsPath } = {}) => {
  const creds = credsByPath(['iwish', credsPath]);
  const { 
    BASE_URL,
    XTOKEN,
  } = creds;

  const headers = {
    xtoken: XTOKEN,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const commonCreds = iwishRequestSetup();
const { baseUrl } = commonCreds;

const iwishClient = new CustomAxiosClientV2({
  requiredContext: ['credsPath'],
  baseUrl,
  preparer: iwishRequestSetup,
});

const iwishPaginator = async (customAxiosPayload, response, additionalPaginationData) => {
  // console.log('iwishPaginator', customAxiosPayload, response, additionalPaginationData);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }
  
  // 1. Extract necessary pagination info
  const { 
    current_page: currentPage, 
    next_page: nextPage,
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
  const done = !nextPage || nextPage === null || nextPage === 'null';

  return [done, paginatedPayload];
};

const iwishDigester = async (response) => {
  // console.log('iwishDigester', response);
  // await askQuestion('?');

  return response?.result?.result;
};

const iwishGetter = (
  url,
  credsPath,
  {
    params,
    ...getterOptions
  } = {},
) => {
  return new Getter({
    url,
    payload: {
      params,
    },

    paginator: iwishPaginator,
    digester: iwishDigester,

    client: iwishClient,
    clientArgs: {
      context: {
        credsPath,
      },
    },

    ...getterOptions
  });
};  

const iwishGet = getterAsGetFunction(iwishGetter);

module.exports = {
  iwishClient,
  iwishGetter,
  iwishGet,
};