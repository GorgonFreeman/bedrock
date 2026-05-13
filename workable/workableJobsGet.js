// https://workable.readme.io/reference/jobs

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { workableGet } = require('../workable/workable.utils');
const { MAX_PER_PAGE } = require('../workable/workable.constants');

const workableJobsGet = async (
  {
    credsPath,

    state,
    sinceId,
    maxId,
    createdAfter,
    updatedAfter,
    includeFields,
    perPage,
  } = {},
) => {

  includeFields = Array.isArray(includeFields) ? includeFields.join(',') : includeFields;

  const params = {
    ...state !== undefined && { state },
    ...sinceId !== undefined && { since_id: sinceId },
    ...maxId !== undefined && { max_id: maxId },
    ...createdAfter !== undefined && { created_after: createdAfter },
    ...updatedAfter !== undefined && { updated_after: updatedAfter },
    ...includeFields !== undefined && { include_fields: includeFields },
    ...perPage !== undefined && { limit: Math.min(perPage, MAX_PER_PAGE) },
  };

  const response = await workableGet('/jobs', {
    credsPath,
    params,
    resultsKey: 'jobs',
  });

  !HOSTED && logDeep(response);
  return response;
};

const workableJobsGetApi = funcApi(workableJobsGet, {
  argNames: ['options'],
});

module.exports = {
  workableJobsGet,
  workableJobsGetApi,
};

// curl localhost:8000/workableJobsGet
// curl localhost:8000/workableJobsGet -H "Content-Type: application/json" -d '{ "options": { "state": "published" } }'
// curl localhost:8000/workableJobsGet -H "Content-Type: application/json" -d '{ "options": { "state": "published", "perPage": 10, "includeFields": ["description", "requirements"] } }'
