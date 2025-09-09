const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyThemeFilePropagate = async (
  credsPath,
  arg,
  {
    apiVersion,
    option,
  } = {},
) => {

  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        ${ attrs }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/Product/${ arg }`,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    context: {
      credsPath,
      apiVersion,
    },
    interpreter: async (response) => {
      // console.log(response);
      return {
        ...response,
        ...response.result ? {
          result: response.result.product,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyThemeFilePropagateApi = async (req, res) => {
  const { 
    credsPath,
    arg,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'arg', arg),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyThemeFilePropagate(
    credsPath,
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyThemeFilePropagate,
  shopifyThemeFilePropagateApi,
};

// curl localhost:8000/shopifyThemeFilePropagate -H "Content-Type: application/json" -d '{ "credsPath": "au", "arg": "6979774283848" }'