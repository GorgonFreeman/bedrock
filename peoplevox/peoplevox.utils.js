const { credsByPath } = require('../utils');

const peoplevoxRequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['peoplevox', credsPath]);

  const {
    CLIENT_ID,
  } = creds;

  return {
    baseUrl: `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`,
  };
};

module.exports = {
  peoplevoxRequestSetup,
};