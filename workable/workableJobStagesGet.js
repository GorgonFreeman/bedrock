// https://workable.readme.io/reference/job-stages

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { workableClient } = require('../workable/workable.utils');

const workableJobStagesGet = async (
  shortcode,
  {
    credsPath,
  } = {},
) => {

  const response = await workableClient.fetch({
    url: `/jobs/${ shortcode }/stages`,
    context: {
      credsPath,
    },
  });

  !HOSTED && logDeep(response);
  return response;
};

const workableJobStagesGetApi = funcApi(workableJobStagesGet, {
  argNames: ['shortcode', 'options'],
  validatorsByArg: {
    shortcode: Boolean,
  },
});

module.exports = {
  workableJobStagesGet,
  workableJobStagesGetApi,
};

// curl localhost:8000/workableJobStagesGet -H "Content-Type: application/json" -d '{ "shortcode": "DEV001" }'
