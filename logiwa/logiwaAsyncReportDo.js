const { funcApi, logDeep, wait, seconds } = require('../utils');
const { logiwaAsyncReportCreate } = require('../logiwa/logiwaAsyncReportCreate');
const { logiwaAsyncReportGet } = require('../logiwa/logiwaAsyncReportGet');

const logiwaAsyncReportDo = async (
  reportTypeCode,
  filter,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const createResponse = await logiwaAsyncReportCreate(reportTypeCode, filter, { credsPath, apiVersion });

  const {
    success: createSuccess,
    result: reportId,
  } = createResponse;
  if (!createSuccess) {
    return createResponse;
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

  const response = {
    success: true,
    result: url,
  };
  logDeep(response);
  return response;
};

const logiwaAsyncReportDoApi = funcApi(logiwaAsyncReportDo, {
  argNames: ['reportTypeCode', 'filter', 'options'],
});

module.exports = {
  logiwaAsyncReportDo,
  logiwaAsyncReportDoApi,
};

// curl localhost:8000/logiwaAsyncReportDo -H "Content-Type: application/json" -d '{ "reportTypeCode": "available_to_promise", "filter": "WarehouseIdentifier.eq=cfbdf154-3052-4e18-84f3-b93b7cde2875" }'