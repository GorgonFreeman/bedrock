// https://developers.asana.com/reference/getuser

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaUserGet = async ({
  credsPath,
  userGid = 'me',
} = {}) => {

  const response = await asanaClient.fetch({
    url: `/users/${ userGid }`,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
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