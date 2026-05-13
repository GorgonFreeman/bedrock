// https://workable.readme.io/reference/jobsshortcode

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { workableClient } = require('../workable/workable.utils');

const workableJobGet = async (
  shortcode,
  {
    credsPath,
  } = {},
) => {

  const response = await workableClient.fetch({
    url: `/jobs/${ shortcode }`,
    context: {
      credsPath,
    },
  });

  !HOSTED && logDeep(response);
  return response;
};

const workableJobGetApi = funcApi(workableJobGet, {
  argNames: ['shortcode', 'options'],
  validatorsByArg: {
    shortcode: Boolean,
  },
});

module.exports = {
  workableJobGet,
  workableJobGetApi,
};

// curl localhost:8000/workableJobGet -H "Content-Type: application/json" -d '{ "shortcode": "DEV001" }'
