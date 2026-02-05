// https://developers.asana.com/reference/getuser

const { respond } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaUserGet = async ({
  credsPath = '',
  userGid = 'me',
  ...options
} = {}) => {

  const response = await asanaClient.fetch({
    url: `/users/${ userGid }`,
    context: {
      credsPath,
    },
  });

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
