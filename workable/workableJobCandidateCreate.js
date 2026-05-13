// https://workable.readme.io/reference/job-candidates-create

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { workableClient } = require('../workable/workable.utils');

const workableJobCandidateCreate = async (
  shortcode,
  candidate,
  {
    credsPath,
    stage,
    sourced = true,
  } = {},
) => {

  const response = await workableClient.fetch({
    url: `/jobs/${ shortcode }/candidates`,
    method: 'post',
    body: {
      sourced,
      ...stage !== undefined && { stage },
      candidate,
    },
    context: {
      credsPath,
    },
  });

  !HOSTED && logDeep(response);
  return response;
};

const workableJobCandidateCreateApi = funcApi(workableJobCandidateCreate, {
  argNames: ['shortcode', 'candidate', 'options'],
  validatorsByArg: {
    shortcode: Boolean,
    candidate: Boolean,
  },
});

module.exports = {
  workableJobCandidateCreate,
  workableJobCandidateCreateApi,
};

// curl localhost:8000/workableJobCandidateCreate -X POST -H "Content-Type: application/json" -d '{ "shortcode": "DEV001", "candidate": { "name": "Jane Doe", "email": "jane@example.com" } }'
// curl localhost:8000/workableJobCandidateCreate -X POST -H "Content-Type: application/json" -d '{ "shortcode": "DEV001", "candidate": { "name": "Jane Doe", "email": "jane@example.com" }, "options": { "sourced": false, "stage": "applied" } }'
