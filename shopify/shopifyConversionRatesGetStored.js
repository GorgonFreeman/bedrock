const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyConversionRatesGetStored = async (
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

const shopifyConversionRatesGetStoredApi = async (req, res) => {
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

  const result = await shopifyConversionRatesGetStored(
    credsPath,
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyConversionRatesGetStored,
  shopifyConversionRatesGetStoredApi,
};

// curl localhost:8000/shopifyConversionRatesGetStored -H "Content-Type: application/json" -d '{ "credsPath": "au", "arg": "6979774283848" }'