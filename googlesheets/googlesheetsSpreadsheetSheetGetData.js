const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');

const googlesheetsSpreadsheetSheetGetData = async (
  {
    spreadsheetId,
    spreadsheetHandle,
  },
  {
    sheetName,
    sheetId,
    sheetIndex,
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

const googlesheetsSpreadsheetSheetGetDataApi = funcApi(googlesheetsSpreadsheetSheetGetData, {
  argNames: ['spreadsheetIdentifier', 'sheetIdentifier', 'options'],
  validatorsByArg: {
    spreadsheetIdentifier: p => objHasAny(p, ['spreadsheetId', 'spreadsheetHandle']),
    sheetIdentifier: p => objHasAny(p, ['sheetName', 'sheetId', 'sheetIndex']),
  },
});

module.exports = {
  googlesheetsSpreadsheetSheetGetData,
  googlesheetsSpreadsheetSheetGetDataApi,
};

// curl localhost:8000/googlesheetsSpreadsheetSheetGetData -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1RuI7MrZ0VPGBLd4EXRIfDy7DVdtcdDKKbA8C5UBJQTM" }, "sheetIdentifier": { "sheetName": "Sheet1" } }'

