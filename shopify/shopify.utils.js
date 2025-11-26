require('dotenv').config();
const { env } = process;
const debug = env.DEBUG === 'true';

const { credsByPath, CustomAxiosClient, stripEdgesAndNodes, Getter, capitaliseString, askQuestion, getterAsGetFunction, strictlyFalsey, logDeep, furthestNode, objHasAll, customNullish, objToArray, surveyNestedArrays, sentenceCaseString, gidToId } = require('../utils');

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

const shopifyClient = new CustomAxiosClient({
  preparer: shopifyRequestSetup,
  requiredContext: ['credsPath'],
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: async (response, context) => {
    const { resultsNode } = context;
    debug && console.log('resultsNode', resultsNode);
    
    debug && logDeep('response', response);
    debug && await askQuestion('Continue?');

    const strippedResponse = stripEdgesAndNodes(response);

    debug && logDeep('strippedResponse', strippedResponse);
    debug && await askQuestion('Continue?');

    const { result } = strippedResponse;
    const { errors, data } = result || {};
    const { [resultsNode]: unnestedResult } = data || {};
    const { userErrors, ...unnestedResultWithoutUserErrors } = unnestedResult || {};

    const hasErrors = errors?.length || userErrors?.length;

    const unnestedResponse = {
      ...strippedResponse,
      success: !hasErrors,
      result: !customNullish(unnestedResultWithoutUserErrors) ? unnestedResultWithoutUserErrors : data,
      ...hasErrors && {
        error: [
          ...errors?.length ? errors : [],
          ...userErrors?.length ? userErrors : [],
        ],
      },
    };

    debug && logDeep('unnestedResponse', unnestedResponse);
    debug && await askQuestion('Continue?');

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
    // https://shopify.dev/docs/api/admin-graphql/latest/objects/fulfillmentOrder#queries
    includeClosed,
    // https://shopify.dev/docs/api/admin-graphql/latest/queries/locations#arguments-includeLegacy
    includeLegacy,
    // https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobjects
    type,
    
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
    ...names ? [`$names: [String!],`] : [],
    ...constraintStatus ? ['$constraintStatus: MetafieldDefinitionConstraintStatus,'] : [],
    ...constraintSubtype ? ['$constraintSubtype: MetafieldDefinitionConstraintSubtypeIdentifier,'] : [],
    ...namespace ? ['$namespace: String,'] : [],
    ...ownerType ? ['$ownerType: MetafieldOwnerType!,'] : [],
    ...pinnedStatus ? ['$pinnedStatus: MetafieldDefinitionPinnedStatus,'] : [],
    ...ownerGid ? ['$owner: ID!,'] : [],
    ...includeClosed ? ['$includeClosed: Boolean,'] : [],
    ...includeLegacy ? ['$includeLegacy: Boolean,'] : [],
    ...type ? ['$type: String!,'] : [],
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
    ...includeClosed ? ['includeClosed: $includeClosed'] : [],
    ...includeLegacy ? ['includeLegacy: $includeLegacy'] : [],
    ...type ? ['type: $type'] : [],
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
    ...includeClosed && { includeClosed },
    ...includeLegacy && { includeLegacy },
    ...type && { type },
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

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCreateV2#arguments-fulfillment.fields.lineItemsByFulfillmentOrder.fulfillmentOrderLineItems
const shopifyFulfillmentLineItemsFromExternalLineItems = (externalLineItems, shopifyLineItems, { 
  extSkuProp = 'sku', 
  extQuantityProp = 'quantity',
  shopifySkuProp = 'sku',
  shopifyQuantityProp = 'unfulfilledQuantity',
} = {}) => {
  
  const fulfillmentLineItemsObject = {};

  for (const externalLineItem of externalLineItems) {

    let {
      [extSkuProp]: extSku,
      [extQuantityProp]: extQuantity,
    } = externalLineItem;

    for (const shopifyLineItem of shopifyLineItems.filter(i => i[shopifyQuantityProp] >= 0)) {
      const {
        id: shopifyLineItemGid,
        [shopifySkuProp]: sku,
        [shopifyQuantityProp]: shopifyQuantity,
      } = shopifyLineItem;

      if (extSku === sku) {

        fulfillmentLineItemsObject[shopifyLineItemGid] = fulfillmentLineItemsObject[shopifyLineItemGid] || 0;

        const deductibleQuantity = Math.min(shopifyQuantity, extQuantity);
        fulfillmentLineItemsObject[shopifyLineItemGid] += deductibleQuantity;
        shopifyLineItem[shopifyQuantityProp] -= deductibleQuantity;
        
        // If no more of this item to mark as fulfilled, stop iterating over Shopify line items
        // Implicitly keep deducting from more line items if not
        extQuantity -= deductibleQuantity;
        if (extQuantity === 0) {
          break;
        }

      }
    }
  }

  const fulfillmentLineItemsPayload = objToArray(fulfillmentLineItemsObject, { keyProp: 'id', valueProp: 'quantity' });

  logDeep(fulfillmentLineItemsPayload);
  return fulfillmentLineItemsPayload;
};

const shopifyCredsPathDistill = (credsPath) => {
  let nodes = Array.isArray(credsPath) 
    ? credsPath.map(node => {
      try {
        return node.split('.');
      } catch (err) {
        return null;
      }
    })
    : credsPath.split('.');
  nodes = nodes.flat().filter(n => n);
  
  return {
    region: nodes[0],
    branch: nodes.slice(1).join('.'),
  };
};

const shopifyJsonlInterpret = (jsonl) => {
  
  const objects = jsonl.split('\n').map(line => {
    try {
      return JSON.parse(line);
    } catch (err) {
      return null;
    }
  }).filter(obj => obj);

  const objectsMap = new Map();

  for (const object of objects) {
    const {
      id: gid,
      __parentId: parentGid,
    } = object;
    
    // e.g. gid://shopify/InventoryLevel/11111111?inventory_item_id=22222222
    const [objectType, id] = gid.split('gid://shopify/')[1].split(/[^a-zA-Z0-9]+/);
    logDeep(objectType, id);

    objectsMap.set(gid, {
      ...object,
      selfType: objectType,
      ...parentGid ? { parentGid } : {},
    });
  }

  const objectTypeToProperty = (objectType) => `${ sentenceCaseString(objectType) }s`;

  for (const [gid, obj] of objectsMap) {
    const { 
      selfType,
      parentGid,
    } = obj;

    if (!parentGid) {
      continue;
    }

    const objectProperty = objectTypeToProperty(selfType);
    
    let parentObject = objectsMap.get(parentGid);

    if (!parentObject) {
      continue;
    }
    
    const nestedParent = gid.split('?')?.[1];

    let nestedParentType;
    let nestedParentId;
    
    if (nestedParent) {
      [nestedParentType, nestedParentId ] = nestedParent.split('=');
      nestedParentType = nestedParentType
        .replaceAll('_id', '')
        .split('_')
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join('')
      ;
      nestedParentType = sentenceCaseString(nestedParentType);
    }

    if (nestedParentType && nestedParentId) {
      parentObject = parentObject[nestedParentType];
    }
    
    parentObject[objectProperty] = parentObject[objectProperty] || [];
    parentObject[objectProperty].push(objectsMap.get(gid));
  }

  const topLevelObjects = Array.from(objectsMap.values()).filter(obj => !obj?.parentGid);
  
  logDeep(topLevelObjects);
  return topLevelObjects;
};

module.exports = {
  shopifyClient,
  shopifyGetter,
  shopifyGet,
  shopifyMutationDo,
  shopifyFulfillmentLineItemsFromExternalLineItems,
  shopifyCredsPathDistill,
  shopifyJsonlInterpret,
};