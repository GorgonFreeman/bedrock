const { credsByPath, CustomAxiosClient } = require('../utils');

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

module.exports = {
  iwishClient,
};