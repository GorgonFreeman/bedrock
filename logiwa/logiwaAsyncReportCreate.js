// https://intercom.help/mylogiwa/en/articles/12182902-asynchronous-report-exports
// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1async-report/post

const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaAsyncReportCreate = async (
  reportTypeCode,
  filter,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'post',
    url: `/Report/async-report`,
    body: {
      reportTypeCode,
      filter,
    },
    context: {
      resultsNode: 'value',
    },
  });
  logDeep(response);
  return response;
};

const logiwaAsyncReportCreateApi = funcApi(logiwaAsyncReportCreate, {
  argNames: [ 
    'reportTypeCode',
    'filter',
    'options',
  ],
});

module.exports = {
  logiwaAsyncReportCreate,
  logiwaAsyncReportCreateApi,
};

// curl localhost:8000/logiwaAsyncReportCreate -H "Content-Type: application/json" -d '{ "reportTypeCode": "available_to_promise", "filter": "WarehouseIdentifier.eq=cfbdf154-3052-4e18-84f3-b93b7cde2875" }'