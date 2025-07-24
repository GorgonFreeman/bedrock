const { credsByPath, CustomAxiosClient, stripEdgesAndNodes, Getter, capitaliseString } = require('../utils');

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

const shopifyGetterPaginator = async (customAxiosPayload, response) => {
  console.log('shopifyGetterPaginatorGraphqlStandard response', response);
  await askQuestion('Continue?');
};

const shopifyGetterDigester = async (response) => {
  console.log('shopifyGetterDigesterGraphqlStandard response', response);
  await askQuestion('Continue?');
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

  const getter = new Getter(undefined, {
    payload: {
      method: 'post',
      body: {
        query,
        variables,
      },
    },
    paginator: shopifyGetterPaginator,
    digester: shopifyGetterDigester,

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