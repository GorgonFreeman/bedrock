const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');
const { shopifySegmentsGet } = require('../shopify/shopifySegmentsGet');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

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
  logDeep(segmentMembersQueryId);
  return segmentMembersQueryId;
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