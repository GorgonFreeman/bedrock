const { credsByPath, CustomAxiosClient, Getter, logDeep, askQuestion } = require('../utils');

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

const printifyClient = new CustomAxiosClient({
  baseUrl,
  factory: ({ credsPath } = {}) => {
    // console.log('printifyClient factory', credsPath);
    const { headers } = printifyRequestSetup({ credsPath });
    return {
      headers,
    };
  },
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

const printifyGetterPaginator = async (customAxiosPayload, response) => {
  logDeep('paginator: decide when done and make next payload', customAxiosPayload, response);
  await askQuestion('?');
};

const printifyGetterDigester = async (response) => {
  logDeep('digester: get items from response', response);
  await askQuestion('?');
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
    url,
    {
      payload: {
        params,
      },
      paginator: printifyGetterPaginator,
      digester: printifyGetterDigester,

      client: printifyClient,
      clientArgs: {
        credsPath,
      },

      ...getterOptions
    },
  );
};

module.exports = {
  printifyClient,
  printifyGetter,
};