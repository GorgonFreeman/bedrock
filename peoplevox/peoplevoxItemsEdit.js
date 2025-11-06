const { json2csv } = require('json-2-csv');
const { funcApi, logDeep, arrayToChunks, groupObjectsByFields, actionMultipleOrSingle } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');
const { MAX_REQUEST_ITEMS } = require('../peoplevox/peoplevox.constants');

const peoplevoxItemsEditChunk = async (
  itemPayloads,
  {
    credsPath,
  } = {},
) => {

  const action = 'SaveData';

  const csvData = await json2csv(itemPayloads);

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': `http://www.peoplevox.net/${ action }`,
    },
    method: 'post',
    body: {
      saveRequest: {
        TemplateName: 'Item types',
        CsvData: csvData,
      },
    },
    context: { 
      credsPath,
      action,
     },
    interpreter: peoplevoxStandardInterpreter(),
  });
  logDeep(response);
  return response;
};

const peoplevoxItemsEdit = async (
  itemPayloads,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  // Sort item payloads into buckets of attribute sets to avoid setting 'undefined', then chunk by max size
  const buckets = groupObjectsByFields(itemPayloads);
  // Chunk each bucket by max size, then flatten all chunks
  const chunksByBucket = buckets.map((bucket) => arrayToChunks(bucket, MAX_REQUEST_ITEMS));
  const chunks = chunksByBucket.flat();

  const response = await actionMultipleOrSingle(
    chunks,
    peoplevoxItemsEditChunk,
    (chunk) => ({
      args: [chunk],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const peoplevoxItemsEditApi = funcApi(peoplevoxItemsEdit, {
  argNames: ['itemPayloads', 'options'],
});

module.exports = {
  peoplevoxItemsEdit,
  peoplevoxItemsEditApi,
};

// curl localhost:8000/peoplevoxItemsEdit -H "Content-Type: application/json" -d '{ "itemPayloads": [{ "ItemCode": "100335-CHC-L", "Attribute7": "ATTR7" }] }'

// Test CSV where some items have values missing (attribute 10) - sets 'undefined' for any missing values, so need to handle this
// curl localhost:8000/peoplevoxItemsEdit -H "Content-Type: application/json" -d '{ "itemPayloads": [{ "ItemCode": "100335-CHC-L", "Attribute9": "Whatever" }, { "ItemCode": "100335-CHC-M", "Attribute9": "Watermelon", "Attribute10": "Werewolf" }] }'