require('dotenv').config();
const { env } = process;
const debug = env.DEBUG === 'true';

const { credsByPath, CustomAxiosClient, stripEdgesAndNodes, Getter, capitaliseString, askQuestion, getterAsGetFunction, strictlyFalsey, logDeep, furthestNode } = require('../utils');

const shopifyRequestSetup = (
  credsPath,
  { 
    apiVersion = '2025-10', 
  } = {},
) => {
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

const shopifyClient = new CustomAxiosClient({
  factory: shopifyRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: async (response) => {
    
    debug && logDeep('response', response);
    debug && await askQuestion('Continue?');

    const strippedResponse = stripEdgesAndNodes(response);

    debug && logDeep('strippedResponse', strippedResponse);
    debug && await askQuestion('Continue?');

    const unnestedResponse = {
      ...strippedResponse,
      ...strippedResponse.result ? {
        result: furthestNode(strippedResponse, 'result', 'data'),
      } : {},
    };

    debug && logDeep('unnestedResponse', unnestedResponse);
    debug && await askQuestion('Continue?');

    const { result } = unnestedResponse;
    const { errors } = result || {};

    if (errors) {
      return {
        ...unnestedResponse,
        success: false,
        result: null,
        error: errors,
      };
    }
    
    return unnestedResponse;
  },
});

const shopifyGetterPaginator = async (customAxiosPayload, response, nodeName) => {
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
  ].join('\n');

  const queryVariableDeclaration = [
    'first: $first',
    'after: $cursor',
    ...queries ? ['query: $query'] : [],
    ...!strictlyFalsey(reverse) ? ['reverse: $reverse'] : [],
    ...savedSearchId ? ['savedSearchId: $savedSearchId'] : [],
    ...sortKey ? [`sortKey: $sortKey`] : [],
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
      factoryArgs: [credsPath, { apiVersion }],
    },

    ...getterOptions,
  });

  return getter;
};

const shopifyGet = getterAsGetFunction(shopifyGetter);

module.exports = {
  shopifyClient,
  shopifyGetter,
  shopifyGet,
};