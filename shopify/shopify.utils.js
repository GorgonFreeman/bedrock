const { credsByPath, CustomAxiosClient, stripEdgesAndNodes, Getter, capitaliseString, askQuestion } = require('../utils');

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
  baseInterpreter: (response) => {
    // console.log(response);
    const strippedResponse = stripEdgesAndNodes(response);
    // TODO: strip edges and nodes
    return {
      ...strippedResponse,
      ...strippedResponse.result ? {
        result: strippedResponse.result.data,
      } : {},
    };
  },
});

const shopifyGetterPaginator = async (customAxiosPayload, response, nodeName) => {
  console.log('shopifyGetterPaginator response', response);
  await askQuestion('Continue?');

  const { success, result } = response;
  if (!success) { // Return if failed
    return [true, null]; 
  }

  // 1. Extract necessary pagination info
  // const { 
  //   current_page: currentPage, 
  //   last_page: lastPage,
  // } = result;

  // 2. Supplement payload with next pagination info
  // const paginatedPayload = {
  //   ...customAxiosPayload,
  //   params: {
  //     ...customAxiosPayload?.params,
  //     page: currentPage + 1,
  //   },
  // };
  
  // 3. Logic to determine done
  // const done = currentPage === lastPage;
  
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
    perPage = 250,
    cursor,
    attrs = 'id',
    resources,
    ...getterOptions
  } = {},
) => {

  resources = resources || `${ resource }s`;
  // Forgive me, this is a capital for legibility
  const Resource = capitaliseString(resource);
  const Resources = capitaliseString(resources);

  const query = `
    query Get${ Resources } ($first: Int!, $cursor: String) {
      ${ resources }(
        first: $first,
        after: $cursor,
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

module.exports = {
  shopifyClient,
  shopifyGetter,
};