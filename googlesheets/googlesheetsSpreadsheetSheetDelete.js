const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');

const googlesheetsSpreadsheetSheetDelete = async (
  {
    spreadsheetId,
    spreadsheetHandle,
  },
  {
    sheetId,
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

const googlesheetsSpreadsheetSheetDeleteApi = funcApi(googlesheetsSpreadsheetSheetDelete, {
  argNames: ['spreadsheetIdentifier', 'sheetIdentifier', 'options'],
  validatorsByArg: {
    spreadsheetIdentifier: p => objHasAny(p, ['spreadsheetId', 'spreadsheetHandle']),
    sheetIdentifier: p => objHasAny(p, ['sheetId']),
  },
});

module.exports = {
  googlesheetsSpreadsheetSheetDelete,
  googlesheetsSpreadsheetSheetDeleteApi,
};

// curl localhost:8000/googlesheetsSpreadsheetSheetDelete -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1RuI7MrZ0VPGBLd4EXRIfDy7DVdtcdDKKbA8C5UBJQTM" } }'

