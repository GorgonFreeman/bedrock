// https://docs.slack.dev/reference/methods/chat.delete

const { funcApi, logDeep } = require('../utils');
const { slackGet } = require('../slack/slack.utils');

const slackUsersGet = async (
  {
    credsPath,
    ...options
  } = {},
) => {
  const response = await slackGet(
    '/users.list',
    'members',
    {
      credsPath,
      ...options,
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
// curl localhost:8000/slackUsersGet -H "Content-Type: application/json" -d '{ "options": { "perPage": 10 } }'