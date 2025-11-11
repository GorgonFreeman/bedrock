// https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get

const { funcApi } = require('../utils');
const { getGoogleSheetsClient } = require('./googlesheets.utils');

const googlesheetsSpreadsheetGet = async (
  spreadsheetId,
  {
    credsPath,
  } = {},
) => {

  const sheetsClient = getGoogleSheetsClient({ credsPath });

  const response = await sheetsClient.spreadsheets.get({
    spreadsheetId,
  });

  return response;
};

const googlesheetsSpreadsheetGetApi = funcApi(googlesheetsSpreadsheetGet, {
  argNames: ['spreadsheetId', 'options'],
});

module.exports = {
  googlesheetsSpreadsheetGet,
  googlesheetsSpreadsheetGetApi,
};

// curl localhost:8000/googlesheetsSpreadsheetGet -H "Content-Type: application/json" -d '{ "spreadsheetId": "..." }'
// curl localhost:8000/googlesheetsSpreadsheetGet -H "Content-Type: application/json" -d '{ "spreadsheetId": "1RuI7MrZ0VPGBLd4EXRIfDy7DVdtcdDKKbA8C5UBJQTM" }'

