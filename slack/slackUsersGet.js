// https://docs.slack.dev/reference/methods/chat.delete

const { funcApi, logDeep } = require('../utils');
const { slackGet } = require('../slack/slack.utils');

const slackUsersGet = async (
  {
    credsPath,
  } = {},
) => {
  const response = await slackGet(
    '/users.list',
    'members',
    {
      credsPath,
    },
  );
  logDeep(response);
  return response;
};

const slackUsersGetApi = funcApi(slackUsersGet, {
  argNames: ['options'],
});

module.exports = {
  slackUsersGet,
  slackUsersGetApi,
};

// curl localhost:8000/slackUsersGet