const { credsByPath, CustomAxiosClient } = require('../utils');

const printifyRequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath([
    'printify', 
    ...credsPath?.split('.') ?? [],
  ]);
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
const { BASE_URL } = commonCreds;

const printifyClient = new CustomAxiosClient({
  baseUrl: BASE_URL,
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

module.exports = {
  printifyClient,
};