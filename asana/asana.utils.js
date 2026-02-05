const { CustomAxiosClient, credsByPath } = require('../utils');

const asanaRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['asana', credsPath]);

  const { 
    BASE_URL,
    PERSONAL_ACCESS_TOKEN,
  } = creds;

  return {
    baseUrl: BASE_URL,
    headers: {
      'Authorization': `Bearer ${ PERSONAL_ACCESS_TOKEN }`,
    },
  };
};

const commonCreds = asanaRequestSetup();
const { baseUrl } = commonCreds;

const asanaClient = new CustomAxiosClient({
  baseUrl,
  preparer: asanaRequestSetup,
  baseInterpreter: (response, context) => {
    
    const { resultsNode } = context;

    if (!resultsNode) {
      return response;
    }

    return {
      ...response,
      ...response?.result && { result: response.result?.[resultsNode] },
    };
  },
});

module.exports = {
  asanaClient,
};