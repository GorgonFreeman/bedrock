// https://workable.readme.io/reference/job-members

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { workableClient } = require('../workable/workable.utils');

const workableJobMembersGet = async (
  shortcode,
  {
    credsPath,
  } = {},
) => {

  const response = await workableClient.fetch({
    url: `/jobs/${ shortcode }/members`,
    context: {
      credsPath,
    },
  });

  !HOSTED && logDeep(response);
  return response;
};

const workableJobMembersGetApi = funcApi(workableJobMembersGet, {
  argNames: ['shortcode', 'options'],
  validatorsByArg: {
    shortcode: Boolean,
  },
});

module.exports = {
  workableJobMembersGet,
  workableJobMembersGetApi,
};

// curl localhost:8000/workableJobMembersGet -H "Content-Type: application/json" -d '{ "shortcode": "DEV001" }'
