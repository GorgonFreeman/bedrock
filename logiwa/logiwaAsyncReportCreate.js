const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaAsyncReportCreate = async (
  arg,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'post',
    url: `/Report/async-report`,
  });
  logDeep(response);
  return response;
};

const logiwaAsyncReportCreateApi = funcApi(logiwaAsyncReportCreate, {
  argNames: [ 
    'arg',
    'options',
  ],
});

module.exports = {
  logiwaAsyncReportCreate,
  logiwaAsyncReportCreateApi,
};

// curl localhost:8000/logiwaAsyncReportCreate -H "Content-Type: application/json" -d '{ "arg": true }'