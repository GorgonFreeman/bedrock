// https://mydeveloper.logiwa.com/#tag/Report/paths/~1v3.1~1Report~1async-report~1%7Bidentifier%7D/get

const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaAsyncReportGet = async (
  reportId,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'get',
    url: `/Report/async-report/${ reportId }`,
  });
  logDeep(response);
  return response;
};

const logiwaAsyncReportGetApi = funcApi(logiwaAsyncReportGet, {
  argNames: ['reportId', 'options'],
});

module.exports = {
  logiwaAsyncReportGet,
  logiwaAsyncReportGetApi,
};

// curl localhost:8000/logiwaAsyncReportGet -H "Content-Type: application/json" -d '{ "reportId": "13569c9d-c526-4257-a70e-f88024a03112" }'