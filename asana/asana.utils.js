const { CustomAxiosClient, credsByPath, askQuestion, logDeep } = require('../utils');

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
  baseInterpreter: async (response, context) => {
    
    const { resultsNode } = context;
    
    const { result } = response;
    let interpretedResult = result?.data ?? result;
    if (resultsNode) {
      interpretedResult = interpretedResult?.[resultsNode];
    }

    const interpretedResponse = {
      ...response,
      ...response?.result && { result: interpretedResult },
    };

    // logDeep({ interpretedResponse });
    // await askQuestion('?');

    return interpretedResponse;
  },
});

module.exports = {
  asanaClient,
};