const { funcApi, logDeep, wait, seconds, objHasAll, customAxios } = require('../utils');
const { logiwaAsyncReportCreate } = require('../logiwa/logiwaAsyncReportCreate');
const { logiwaAsyncReportGet } = require('../logiwa/logiwaAsyncReportGet');
const zlib = require('zlib');
const csvtojson = require('csvtojson');

const logiwaAsyncReportDo = async (
  {
    // if creating
    reportTypeCode,
    filter,
    
    // if resuming
    reportId,
  },
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {
  
  // If not resuming, then creating
  if (!reportId) {
    const createResponse = await logiwaAsyncReportCreate(reportTypeCode, filter, { credsPath, apiVersion });

    const {
      success: createSuccess,
      result: createResult,
    } = createResponse;
    if (!createSuccess) {
      return createResponse;
    }

    reportId = createResult;
  }

  let finished;
  let finalReportResult;

  do {
    await wait(seconds(5));
    const getResponse = await logiwaAsyncReportGet(reportId, { credsPath, apiVersion });

    const {
      success: getSuccess,
      result: getResult,
    } = getResponse;
    
    if (!getSuccess) {
      return getResponse;
    }

    const {
      // statusCode,
      completedDateTime,
    } = getResult;

    finished = completedDateTime !== null;
    finalReportResult = getResult;
  } while (!finished);

  const {
    url,
  } = finalReportResult;

  if (!url) {
    return {
      success: false,
      error: [finalReportResult],
    };
  }

  const resultsResponse = await customAxios(url, { responseType: 'arraybuffer' });
  const { 
    success: resultsSuccess, 
    result: reportFileContent, 
  } = resultsResponse;
  if (!resultsSuccess) {
    return resultsResponse;
  }

  const csvData = zlib.gunzipSync(reportFileContent).toString('utf-8');
  const data = await csvtojson().fromString(csvData);

  const response = {
    success: true,
    result: data,
  };
  logDeep(response);
  return response;
};

const logiwaAsyncReportDoApi = funcApi(logiwaAsyncReportDo, {
  argNames: [ 
    'reportPayload',
    'options',
  ],
  validatorsByArg: {
    reportPayload: p => (objHasAll(p, ['reportTypeCode', 'filter']) || objHasAll(p, ['reportId'])),
  },
});

module.exports = {
  logiwaAsyncReportDo,
  logiwaAsyncReportDoApi,
};

// curl localhost:8000/logiwaAsyncReportDo -H "Content-Type: application/json" -d '{ "reportPayload": { "reportTypeCode": "available_to_promise", "filter": "WarehouseIdentifier.eq=cfbdf154-3052-4e18-84f3-b93b7cde2875" } }'
// curl localhost:8000/logiwaAsyncReportDo -H "Content-Type: application/json" -d '{ "reportPayload": { "reportId": "1ed3ad7f-fe66-429f-8e06-ac691aef1ece" } }'