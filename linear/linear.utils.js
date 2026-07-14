const { credsByPath, CustomAxiosClient, stripEdgesAndNodes, Getter, capitaliseString, getterAsGetFunction, strictlyFalsey, customNullish } = require('../utils');

const linearRequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['linear', credsPath]);

  const {
    API_KEY,
    BASE_URL,
  } = creds;

  const headers = {
    // Personal API keys: Authorization: <API_KEY> (no Bearer)
    // OAuth access tokens: Authorization: Bearer <ACCESS_TOKEN>
    'Authorization': `${ API_KEY }`,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const linearClient = new CustomAxiosClient({
  preparer: linearRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: (response, context = {}) => {

    const { resultsNode } = context;

    const strippedResponse = stripEdgesAndNodes(response);

    const { result } = strippedResponse;
    const { errors, data } = result || {};
    const { [resultsNode]: unnestedResult } = data || {};

    // Linear mutations typically return { success, issue/project/... } rather than userErrors
    const mutationFailed = unnestedResult?.success === false;
    const hasErrors = errors?.length || mutationFailed;

    return {
      ...strippedResponse,
      success: !hasErrors,
      result: !customNullish(unnestedResult) ? unnestedResult : data,
      ...hasErrors && {
        error: [
          ...errors?.length ? errors : [],
          ...mutationFailed ? [unnestedResult] : [],
        ],
      },
    };
  },
});

const linearGetterPaginator = async (customAxiosPayload, response, additionalPaginationData, nodeName) => {

  const { success, result } = response;
  if (!success) {
    return [true, null];
  }

  // 1. Extract necessary pagination info
  const { pageInfo } = result[nodeName];
  const { hasNextPage, endCursor } = pageInfo;

  // 2. Supplement payload with next pagination info
  const paginatedPayload = {
    ...customAxiosPayload,
    body: {
      ...customAxiosPayload?.body,
      variables: {
        ...customAxiosPayload?.body?.variables,
        cursor: endCursor,
      },
    },
  };

  // 3. Logic to determine done
  const done = !hasNextPage;

  return [done, paginatedPayload];
};

const linearGetterDigester = async (response, nodeName) => {

  const { success, result } = response;

  if (!success) {
    return null;
  }

  // stripEdgesAndNodes turns edges[].node into items
  const items = result?.[nodeName]?.['items'];
  return items;
};

const linearGetter = async (
  credsPath,
  resource,
  {
    attrs = 'id',
    orderBy,
    filter,
    filterType, // e.g. 'IssueFilter', 'TeamFilter' — required if filter is set
    includeArchived,
    perPage = 250,
    cursor,

    resources,

    ...getterOptions
  } = {},
) => {

  resources = resources || `${ resource }s`;
  const Resources = capitaliseString(resources);

  if (filter && !filterType) {
    throw new Error('filterType is required when filter is provided (e.g. IssueFilter, TeamFilter)');
  }

  const queryTypeDeclaration = [
    '$first: Int!',
    '$cursor: String',
    ...orderBy ? ['$orderBy: PaginationOrderBy,'] : [],
    ...filter ? [`$filter: ${ filterType },`] : [],
    ...!strictlyFalsey(includeArchived) ? ['$includeArchived: Boolean,'] : [],
  ].join('\n');

  const queryVariableDeclaration = [
    'first: $first',
    'after: $cursor',
    ...orderBy ? ['orderBy: $orderBy'] : [],
    ...filter ? ['filter: $filter'] : [],
    ...!strictlyFalsey(includeArchived) ? ['includeArchived: $includeArchived'] : [],
  ].join('\n');

  // Use edges so stripEdgesAndNodes -> items works with the digester
  const query = `
    query Get${ Resources } (
      ${ queryTypeDeclaration }
    ) {
      ${ resources }(
        ${ queryVariableDeclaration }
      ) {
        edges {
          node {
            ${ attrs }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    first: perPage,
    cursor,
    ...orderBy && { orderBy },
    ...filter && { filter },
    ...!strictlyFalsey(includeArchived) && { includeArchived },
  };

  const getter = new Getter({
    payload: {
      method: 'post',
      body: {
        query,
        variables,
      },
    },
    paginator: (...args) => linearGetterPaginator(...args, resources),
    digester: (...args) => linearGetterDigester(...args, resources),

    client: linearClient,
    clientArgs: {
      context: {
        credsPath,
      },
    },

    ...getterOptions,
  });

  return getter;
};

const linearGet = getterAsGetFunction(linearGetter);

module.exports = {
  linearClient,
  linearGetterPaginator,
  linearGetterDigester,
  linearGetter,
  linearGet,
};
