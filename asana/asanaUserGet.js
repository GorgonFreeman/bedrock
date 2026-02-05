// https://developers.asana.com/reference/getuser

const { respond, funcApi } = require('../utils');
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

const asanaUserGetApi = funcApi(asanaUserGet, {
  argNames: ['options'],
});

module.exports = {
  asanaUserGet,
  asanaUserGetApi,
};

// curl localhost:8000/asanaUserGet
