const { credsByPath, CustomAxiosClient, Getter, askQuestion, logDeep, getterAsGetFunction } = require('../utils');

const starshipitRequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['starshipit', credsPath]);
  // console.log(creds);

  const { 
    BASE_URL,
    API_KEY,
    SUB_KEY,
  } = creds;

  const headers = {
    'StarShipIT-Api-Key': API_KEY,
    'Ocp-Apim-Subscription-Key': SUB_KEY,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

// get base url for use in client
const commonCreds = starshipitRequestSetup();
const { baseUrl } = commonCreds;

const starshipitClient = new CustomAxiosClient({
  baseUrl,
  factory: starshipitRequestSetup,
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

const starshipitGetterPaginator = async (customAxiosPayload, response, nodeName) => {
  // logDeep('paginator: decide when done and make next payload', customAxiosPayload, response);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }

  // 1. Extract necessary pagination info
  const {
    page: currentPage,
    page_size: pageSize,
  } = customAxiosPayload?.params;

  // TODO: Pass cumulative results count back into paginators for checking if done - pageSize is optional

  const { 
    total_count: totalCount,
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
  const done = currentPage * pageSize >= totalCount;
  
  return [done, paginatedPayload];
};

const starshipitGetterDigester = async (response, nodeName) => {
  // logDeep('digester: get items from response', response);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return null;
  }

  const items = result?.[nodeName];
  return items;
};

const starshipitGetter = async (
  credsPath,
  url,
  {
    params,
    nodeName = 'results',
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        params,
      },
      paginator: (...args) => starshipitGetterPaginator(...args, nodeName),
      digester: (...args) => starshipitGetterDigester(...args, nodeName),

      client: starshipitClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },

      ...getterOptions
    },
  );
};

const starshipitGet = getterAsGetFunction(starshipitGetter);

module.exports = {
  starshipitClient,
  starshipitGetter,
  starshipitGet,
};