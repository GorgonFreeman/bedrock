const { respond, mandateParam, logDeep, capitaliseString } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyGetSingle = async (
  credsPath,
  resource,
  id,
  {
    apiVersion,
    attrs = defaultAttrs,
    gidType,
  } = {},
) => {

  const Resource = capitaliseString(resource);

  const query = `
    query Get${ Resource } ${ resource === 'shop' ? '' : '($id: ID!)' } {
      ${ resource }${ resource === 'shop' ? '' : '(id: $id)' } {
        ${ attrs }
      } 
    }
  `;

  const variables = {
    id: `gid://shopify/${ gidType || Resource }/${ id }`,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    context: {
      credsPath,
      apiVersion,
      resultsNode: resource,
    },
    interpreter: async (response) => {
      // console.log(response);
      return {
        ...response,
        ...response.result ? {
          result: response.result[resource],
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyGetSingleApi = async (req, res) => {
  const { 
    credsPath,
    resource,
    id,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'resource', resource),
    mandateParam(res, 'id', id),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyGetSingle(
    credsPath,
    resource,
    id,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyGetSingle,
  shopifyGetSingleApi,
};

// curl localhost:8000/shopifyGetSingle -H "Content-Type: application/json" -d '{ "credsPath": "au", "resource": "product", "id": "6979774283848" }'