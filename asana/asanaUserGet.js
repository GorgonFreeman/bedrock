// https://developers.asana.com/reference/getuser

const { respond, credsByPath, customAxios } = require('../utils');

const asanaUserGet = async ({
  credsPath = '',
  userGid = 'me',
  ...options
} = {}) => {
  const { 
    BASE_URL,
    PERSONAL_ACCESS_TOKEN,
  } = credsByPath(['asana', credsPath]);

  if (!BASE_URL) {
    throw new Error('BASE_URL is required in Asana credentials');
  }

  const baseUrl = BASE_URL.replace(/\/$/, '');
  const url = `${ baseUrl }/users/${ userGid }`;

  const headers = {
    'Authorization': `Bearer ${ PERSONAL_ACCESS_TOKEN }`,
  };

  const response = await customAxios(
    url,
    {
      method: 'get',
      headers,
      params: options,
    },
  );

  return response;
};

const asanaUserGetApi = async (req, res) => {
  const { 
    options = {},
  } = req.body;

  const result = await asanaUserGet(options);
  respond(res, 200, result);
};

module.exports = {
  asanaUserGet,
  asanaUserGetApi,
};

// curl localhost:8000/asanaUserGet
