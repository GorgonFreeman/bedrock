const { credsByPath } = require('../utils');

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

module.exports = {
  iwishRequestSetup,
};