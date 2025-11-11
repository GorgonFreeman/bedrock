// https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get

const { google } = require('googleapis');

const { funcApi, credsByPath } = require('../utils');

const googlesheetsSpreadsheetGet = async (
  spreadsheetId,
  {
    credsPath,
  } = {},
) => {

  const creds = credsByPath(['googlesheets', credsPath]);
  const { SERVICE_ACCOUNT_JSON } = creds;

  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT_JSON,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  const response = await sheets.spreadsheets.get({
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

