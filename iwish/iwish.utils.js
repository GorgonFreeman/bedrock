const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction, askQuestion } = require('../utils');

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

const iwishClient = new CustomAxiosClient({
  baseUrl,
  factory: iwishRequestSetup,
});

const iwishPaginator = async (customAxiosPayload, response, additionalPaginationData) => {
  console.log('iwishPaginator', customAxiosPayload, response, additionalPaginationData);
  await askQuestion('?');
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