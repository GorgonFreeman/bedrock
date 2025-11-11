// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get

const { funcApi, logDeep } = require('../utils');
const { googlesheetsClient } = require('../googlesheets/googlesheets.utils');

const googlesheetsValuesGet = async (
  spreadsheetId,
  range,
  {
    credsPath,
    valueRenderOption = 'FORMATTED_VALUE', // UNFORMATTED_VALUE, FORMULA
    dateTimeRenderOption = 'SERIAL_NUMBER', // FORMATTED_STRING
  } = {},
) => {
  const url = `/spreadsheets/${ encodeURIComponent(spreadsheetId) }/values/${ encodeURIComponent(range) }`;
  const params = {
    valueRenderOption,
    dateTimeRenderOption,
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

const googlesheetsValuesGetApi = funcApi(googlesheetsValuesGet, {
  argNames: ['spreadsheetId', 'range', 'options'],
  validatorsByArg: {
    spreadsheetId: Boolean,
    range: Boolean,
  },
});

module.exports = {
  googlesheetsValuesGet,
  googlesheetsValuesGetApi,
};

// curl localhost:8000/googlesheetsValuesGet -H "Content-Type: application/json" -d '{ "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms", "range": "Class Data!A2:E" }'

