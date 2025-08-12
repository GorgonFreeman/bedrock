require('dotenv').config();
const { env } = process;
const debug = env.DEBUG === 'true';

const { credsByPath, CustomAxiosClientV2, stripEdgesAndNodes, Getter, capitaliseString, askQuestion, getterAsGetFunction, strictlyFalsey, logDeep, furthestNode, objHasAll } = require('../utils');

const shopifyRequestSetup = ({ 
  credsPath,
  apiVersion = '2025-10', 
} = {}) => {
  // returns { baseUrl, headers }
  
  const creds = credsByPath(['shopify', credsPath]);

  const { STORE_URL, SHOPIFY_API_KEY } = creds;

  const baseUrl = `https://${ STORE_URL }.myshopify.com/admin/api/${ apiVersion }/graphql.json`;

  const headers = {
    'X-Shopify-Access-Token': SHOPIFY_API_KEY,
  };

  return { 
    baseUrl,
    headers,
  }; 
};

const shopifyClient = new CustomAxiosClientV2({
  preparer: shopifyRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: async (response, context) => {
    const { resultsNode } = context;
    
    debug && logDeep('response', response);
    debug && await askQuestion('Continue?');

    const strippedResponse = stripEdgesAndNodes(response);

    debug && logDeep('strippedResponse', strippedResponse);
    debug && await askQuestion('Continue?');

    const unnestedResponse = {
      ...strippedResponse,
      ...strippedResponse.result ? {
        result: furthestNode(strippedResponse, 'result', 'data', resultsNode),
      } : {},
    };

    debug && logDeep('unnestedResponse', unnestedResponse);
    debug && await askQuestion('Continue?');

    const { result } = unnestedResponse;
    const { errors, userErrors } = result || {};
    
    // console.log('unnestedResponse', unnestedResponse);
    // console.log('errors', errors);
    // console.log('userErrors', userErrors);

    if (errors?.length || userErrors?.length) {
      return {
        ...unnestedResponse,
        success: false,
        result: null,
        error: [
          ...errors?.length ? [errors] : [],
          ...userErrors?.length ? [userErrors] : [],
        ],
      };
    }
    
    return unnestedResponse;
  },
});

const shopifyGetterPaginator = async (customAxiosPayload, response, additionalPaginationData, nodeName) => {
  // console.log('shopifyGetterPaginator response', response);
  // await askQuestion('Continue?');

  const { success, result } = response;
  if (!success) { // Return if failed
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

const shopifyGetterDigester = async (response, nodeName) => {
  // console.log('shopifyGetterDigester response', response);
  // await askQuestion('Continue?');

  const { success, result } = response;
  
  // Return if error
  if (!success) {
    return null;
  }

  const items = result?.[nodeName]?.['items'];
  return items;
};

const shopifyGetter = async (
  credsPath, 
  resource, 
  { 
    apiVersion,

    // Related to the actual query
    perPage = 250,
    cursor,
    attrs = 'id',
    queries,
    reverse,
    savedSearchId,
    sortKey,
    // https://shopify.dev/docs/api/admin-graphql/latest/queries/themes#arguments-names
    roles,
    names,
    // https://shopify.dev/docs/api/admin-graphql/unstable/queries/metafielddefinitions
    constraintStatus,
    constraintSubtype,
    namespace,
    ownerType,
    pinnedStatus,
    // https://shopify.dev/docs/api/admin-graphql/unstable/queries/metafields#arguments-owner
    ownerGid,
    
    // Helpers
    resources, // for when plural of the resource isn't `${ resource }s`

    ...getterOptions
  } = {},
) => {

  resources = resources || `${ resource }s`;
  // Forgive me, this is a capital for legibility
  const Resource = capitaliseString(resource);
  const Resources = capitaliseString(resources);

  const queryTypeDeclaration = [
    '$first: Int!',
    '$cursor: String',
    ...queries ? ['$query: String,'] : [],
    ...!strictlyFalsey(reverse) ? ['$reverse: Boolean,'] : [],
    ...savedSearchId ? ['$savedSearchId: ID,'] : [],
    ...sortKey ? [`$sortKey: ${ Resource }SortKeys,`] : [],
    ...roles ? [`$roles: [${ Resource }Role!],`] : [],
    ...names ? [`$names: [String],`] : [],
    ...constraintStatus ? ['$constraintStatus: MetafieldDefinitionConstraintStatus,'] : [],
    ...constraintSubtype ? ['$constraintSubtype: MetafieldDefinitionConstraintSubtypeIdentifier,'] : [],
    ...namespace ? ['$namespace: String,'] : [],
    ...ownerType ? ['$ownerType: MetafieldOwnerType!,'] : [],
    ...pinnedStatus ? ['$pinnedStatus: MetafieldDefinitionPinnedStatus,'] : [],
    ...ownerGid ? ['$owner: ID!,'] : [],
  ].join('\n');

  const queryVariableDeclaration = [
    'first: $first',
    'after: $cursor',
    ...queries ? ['query: $query'] : [],
    ...!strictlyFalsey(reverse) ? ['reverse: $reverse'] : [],
    ...savedSearchId ? ['savedSearchId: $savedSearchId'] : [],
    ...sortKey ? [`sortKey: $sortKey`] : [],
    ...roles ? [`roles: $roles`] : [],
    ...names ? [`names: $names`] : [],
    ...constraintStatus ? ['constraintStatus: $constraintStatus'] : [],
    ...constraintSubtype ? ['constraintSubtype: $constraintSubtype'] : [],
    ...namespace ? ['namespace: $namespace'] : [],
    ...ownerType ? ['ownerType: $ownerType'] : [],
    ...pinnedStatus ? ['pinnedStatus: $pinnedStatus'] : [],
    ...ownerGid ? ['owner: $owner'] : [],
  ].join('\n');

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
    ...!strictlyFalsey(reverse) && { reverse },
    ...queries && { query: queries.join(' AND ') },
    ...savedSearchId && { savedSearchId: `gid://shopify/SavedSearch/${ savedSearchId }` },
    ...sortKey && { sortKey },
    ...roles && { roles },
    ...names && { names },
    ...constraintStatus && { constraintStatus },
    ...constraintSubtype && { constraintSubtype },
    ...namespace && { namespace },
    ...ownerType && { ownerType },
    ...pinnedStatus && { pinnedStatus },
    ...ownerGid && { owner: ownerGid },
  };

  const getter = new Getter({
    payload: {
      method: 'post',
      body: {
        query,
        variables,
      },
    },
    paginator: (...args) => shopifyGetterPaginator(...args, resources),
    digester: (...args) => shopifyGetterDigester(...args, resources),

    client: shopifyClient,
    clientArgs: {
      context: {
        credsPath, 
        apiVersion,
      },
    },

    ...getterOptions,
  });

  return getter;
};

const shopifyGet = getterAsGetFunction(shopifyGetter);

const shopifyMutationDo = async (
  credsPath,
  mutationName,
  mutationVariables,
  returnSchema,
  { 
    apiVersion,
    ...clientOptions
  } = {},
) => {

  // Check if mutationVariables is valid
  if (Object.values(mutationVariables).some(variable => !objHasAll(variable, ['type', 'value']))) {
    console.error(mutationVariables);
    throw new Error('mutationVariables must include type and value');
  }

  const mutation = `
    mutation ${ mutationName }(${ Object.entries(mutationVariables).map(([name, { type }]) => `$${ name }: ${ type }`).join(', ') }) {
      ${ mutationName }(${ Object.keys(mutationVariables).map(name => `${ name }: $${ name }`).join(', ') }) {
        ${ returnSchema }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {};
  for (const [name, { value }] of Object.entries(mutationVariables)) {
    variables[name] = value;
  }

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    context: {
      credsPath,
      apiVersion,
      resultsNode: mutationName,
    },
    ...clientOptions,
  });

  logDeep(response);
  return response;
};

module.exports = {
  shopifyClient,
  shopifyGetter,
  shopifyGet,
  shopifyMutationDo,
};