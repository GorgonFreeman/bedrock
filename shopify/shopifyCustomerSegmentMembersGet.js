const { respond, mandateParam, logDeep, wait, gidToId } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');
const { shopifySegmentsGet } = require('../shopify/shopifySegmentsGet');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id firstName lastName defaultEmailAddress { emailAddress }`;

const shopifyCustomerSegmentMembersGet = async (
  credsPath,
  segmentName,
  {
    apiVersion,
    attrs = defaultAttrs,
    first = 250,
  } = {},
) => {

  // Fetch all segments
  const segmentsResult = await shopifySegmentsGet(credsPath);
  if (!segmentsResult.success) {
    console.log(`Error fetching segments`);
    return segmentsResult;
  }
  const segments = segmentsResult.result;
  const targetSegmentGid = segments.find(segment => segment.name === segmentName)?.id;
  if (!targetSegmentGid) {
    return {
      success: false,
      error: [`Segment ${ segmentName } not found`],
    };
  }

  // Create a segment members query
  const segmentMembersQueryCreateResult = await shopifyMutationDo(
    credsPath,
    'customerSegmentMembersQueryCreate', 
    {
      input: {
        type: 'CustomerSegmentMembersQueryInput!',
        value: {
          segmentId: targetSegmentGid,
        },
      },
    },
    'customerSegmentMembersQuery { id currentCount done }',
    {
      apiVersion,
    },
  );

  if (!segmentMembersQueryCreateResult.success) {
    console.log(`Error creating segment members query`);
    return {
      success: false,
      error: [`Error creating segment members query`],
    };
  }

  // Get the segment members query id
  const segmentMembersQueryId = segmentMembersQueryCreateResult?.result?.customerSegmentMembersQuery?.id;
  if (!segmentMembersQueryId) {
    console.log(`Error extracting segment members query id`);
    return {
      success: false,
      error: [`Segment members query id not found`],
    };
  }

  // Poll and wait for the query to be done
  let segmentMembersQueryDone = false;
  while (!segmentMembersQueryDone) {
    const segmentMembersQuery = await shopifyGetSingle(credsPath, 'customerSegmentMembersQuery', gidToId(segmentMembersQueryId), { attrs: 'id currentCount done', subKey: 'id' });
    const { currentCount, done } = segmentMembersQuery.result;
    segmentMembersQueryDone = done;
    console.log(`Segment members query | Current count: ${ currentCount } | Done: ${ done }`);
    await wait(1000);
  }

  // Fetch the segment members
  const method = 'post';
  const query = `
    query GetCustomerSegmentMembers ($first: Int!, $queryId: ID!) {
      customerSegmentMembers (first: $first, queryId: $queryId) {
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
    first,
    queryId: segmentMembersQueryId,
  };
  const customerSegmentMembersResult = await shopifyClient.fetch({
    method,
    body: {
      query,
      variables,
    },
    context: {
      credsPath,
      apiVersion,
    },
    interpreter: async (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.customerSegmentMembers,
        } : {},
      };
    },
  });

  return customerSegmentMembersResult;
};

const shopifyCustomerSegmentMembersGetApi = async (req, res) => {
  const { 
    credsPath,
    segmentName,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'segmentName', segmentName),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerSegmentMembersGet(
    credsPath,
    segmentName,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerSegmentMembersGet,
  shopifyCustomerSegmentMembersGetApi,
};

// curl localhost:8000/shopifyCustomerSegmentMembersGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "segmentName": "Store Credit Check" }'