const { credsByPath } = require('../utils');

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

module.exports = {
  printifyRequestSetup,
};