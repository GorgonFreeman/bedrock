const { credsByPath, CustomAxiosClient, logDeep, askQuestion } = require('../utils');

const pipe17RequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['pipe17', credsPath]);
  // console.log(creds);

  const { 
    API_KEY,
    BASE_URL,
  } = creds;

  const headers = {
    'X-Pipe17-Key': API_KEY,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const pipe17Client = new CustomAxiosClient({
  factory: pipe17RequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

module.exports = {
  pipe17Client,
};