// https://linear.app/developers/graphql
// https://linear.app/developers/pagination

const { respond, logDeep } = require('../utils');
const { linearGet, linearGetter } = require('../linear/linear.utils');

const defaultAttrs = `
  id
  identifier
  title
  createdAt
  updatedAt
`;

const payloadMaker = (
  {
    credsPath,

    attrs = defaultAttrs,
    filter,
    filterType = 'IssueFilter',
    orderBy,
    includeArchived,
    perPage,
    cursor,
    ...options
  } = {},
) => {
  return [
    credsPath,
    'issue',
    {
      attrs,
      ...filter && { filter, filterType },
      ...orderBy && { orderBy },
      ...includeArchived !== undefined && { includeArchived },
      ...perPage && { perPage },
      ...cursor && { cursor },
      ...options,
    },
  ];
};

const linearIssuesGet = async (...args) => {
  const response = await linearGet(...payloadMaker(...args));
  logDeep(response);
  return response;
};

const linearIssuesGetter = async (...args) => {
  const response = await linearGetter(...payloadMaker(...args));
  return response;
};

const linearIssuesGetApi = async (req, res) => {
  const {
    options,
  } = req.body;

  const result = await linearIssuesGet(options);
  respond(res, 200, result);
};

module.exports = {
  linearIssuesGet,
  linearIssuesGetter,
  linearIssuesGetApi,
};

// curl localhost:8000/linearIssuesGet
// curl localhost:8000/linearIssuesGet -H "Content-Type: application/json" -d '{ "options": { "orderBy": "updatedAt", "attrs": "id identifier title state { name }" } }'
