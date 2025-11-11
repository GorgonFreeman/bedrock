// https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get

const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');

const googlesheetsSpreadsheetGet = async (
  {
    spreadsheetId,
    spreadsheetHandle,
  },
  {
    credsPath,
  } = {},
) => {

  if (!spreadsheetId) {
    spreadsheetId = spreadsheetHandleToSpreadsheetId[spreadsheetHandle];
  }

  if (!spreadsheetId) {
    return {
      success: false,
      errors: [`Couldn't get a spreadsheet ID from ${ spreadsheetHandle }`],
    };
  }

  const sheetsClient = getGoogleSheetsClient({ credsPath });

  const response = await sheetsClient.spreadsheets.get({
    spreadsheetId,
  });

  return response;
};

const googlesheetsSpreadsheetGetApi = funcApi(googlesheetsSpreadsheetGet, {
  argNames: ['spreadsheetIdentifier', 'options'],
  validatorsByArg: {
    spreadsheetIdentifier: p => objHasAny(p, ['spreadsheetId', 'spreadsheetHandle']),
  },
});

module.exports = {
  googlesheetsSpreadsheetGet,
  googlesheetsSpreadsheetGetApi,
};

// curl localhost:8000/googlesheetsSpreadsheetGet -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1RuI7MrZ0VPGBLd4EXRIfDy7DVdtcdDKKbA8C5UBJQTM" } }'

