const xml2json = require('xml2json');
const { credsByPath, CustomAxiosClient } = require('../utils');

const peoplevoxRequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['peoplevox', credsPath]);

  const {
    CLIENT_ID,
  } = creds;

  return {
    baseUrl: `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`,
  };
};

const peoplevoxClient = new CustomAxiosClient({
  baseHeaders: {
    'Content-Type': 'text/xml; charset=utf-8',
  },
  factory: peoplevoxRequestSetup,
  baseInterpreter: (response) => {
    const parsedResponse = {
      ...response,
      ...response.result ? {
        result: xml2json.toJson(response.result, { object: true }),
      } : {},
    };
    return parsedResponse;
  },
});

module.exports = {
  peoplevoxClient,
};