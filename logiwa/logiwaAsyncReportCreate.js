// https://intercom.help/mylogiwa/en/articles/12182902-asynchronous-report-exports
// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1async-report/post

const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaAsyncReportCreate = async (
  reportTypeCode,
  {
    credsPath,
    apiVersion = 'v3.1',
    filter,
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'post',
    url: `/Report/async-report`,
    body: {
      reportTypeCode,
      ...filter ? { filter } : {},
    },
  });
  logDeep(response);
  return response;
};

const logiwaAsyncReportCreateApi = funcApi(logiwaAsyncReportCreate, {
  argNames: [ 
    'reportTypeCode',
    'options',
  ],
});

module.exports = {
  logiwaAsyncReportCreate,
  logiwaAsyncReportCreateApi,
};

// curl localhost:8000/logiwaAsyncReportCreate -H "Content-Type: application/json" -d '{ "reportTypeCode": "available_to_promise" }'