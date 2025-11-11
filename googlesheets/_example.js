// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/get

const { funcApi, logDeep } = require('../utils');
const { googlesheetsClient } = require('../googlesheets/googlesheets.utils');

const FUNC = async (
  spreadsheetId,
  {
    credsPath,
    ranges,
    includeGridData = false,
  } = {},
) => {
  const url = `/spreadsheets/${ encodeURIComponent(spreadsheetId) }`;
  const params = {
    ranges: Array.isArray(ranges) ? ranges.join(',') : ranges,
    includeGridData,
  };

  const response = await googlesheetsClient.fetch({
    url,
    params,
    context: {
      credsPath: credsPath || 'default',
    },
  });
  
  logDeep('response', response);
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['spreadsheetId', 'options'],
  validatorsByArg: {
    spreadsheetId: Boolean,
  },
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" }'

