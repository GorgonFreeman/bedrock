// https://linear.app/developers/graphql
// https://linear.app/developers/pagination

const { funcApi, logDeep } = require('../utils');
const { linearGet, linearGetter } = require('../linear/linear.utils');

const defaultAttrs = `
  id
`;

const payloadMaker = (
  {
    credsPath,

    attrs = defaultAttrs,
    filter,
    filterType,
    orderBy,
    includeArchived,
    perPage,
    cursor,
    ...options
  } = {},
) => {
  return [
    credsPath,
    'thing',
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

const FUNC = async (...args) => {
  const response = await linearGet(...payloadMaker(...args));
  logDeep(response);
  return response;
};

const FUNCter = async (...args) => {
  const response = await linearGetter(...payloadMaker(...args));
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['options'],
});

module.exports = {
  FUNC,
  FUNCter,
  FUNCApi,
};

// curl localhost:8000/FUNC
// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "options": { "perPage": 2, "orderBy": "updatedAt" } }'
