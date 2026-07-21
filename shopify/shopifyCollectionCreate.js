// https://shopify.dev/docs/api/admin-graphql/latest/mutations/collectionCreate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyCollectionCreate = async (
  credsPath,
  collectionInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'collectionCreate',
    {
      input: {
        type: 'CollectionInput!',
        value: collectionInput,
      },
    },
    `collection { ${ returnAttrs } }`,
    { 
      apiVersion,

      // client options
      interpreter: async (response) => {
        return {
          ...response,
          ...response?.result?.collection ? {
            result: response.result.collection,
          } : {},
        };
      },
    },
  );
  logDeep(response);
  return response;
};

const shopifyCollectionCreateApi = async (req, res) => {
  const {
    credsPath,
    collectionInput,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'collectionInput', collectionInput),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCollectionCreate(
    credsPath,
    collectionInput,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCollectionCreate,
  shopifyCollectionCreateApi,
};

// curl http://localhost:8000/shopifyCollectionCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "collectionInput": { "title": "Summer Essentials" }, "options": { "returnAttrs": "id title handle" } }'
/* curl http://localhost:8000/shopifyCollectionCreate -H 'Content-Type: application/json' -d
'{
  "credsPath": "au",
  "collectionInput": {
    "title": "Best Sellers",
    "descriptionHtml": "Best Sellers from July 2026",
    "ruleSet": {
      "appliedDisjunctively": false,
      "rules": [
        { "column": "TAG",
          "relation": "EQUALS",
          "condition": "best-sellers"
        },
      ],
    },
    "sortOrder": "BEST_SELLING"
  }
}'
*/