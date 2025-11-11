const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');

const googlesheetsSpreadsheetSheetAdd = async (
  {
    spreadsheetId,
    spreadsheetHandle,
  },
  {
    objArray,
  },
  {
    sheetName,
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

const googlesheetsSpreadsheetSheetAddApi = funcApi(googlesheetsSpreadsheetSheetAdd, {
  argNames: ['spreadsheetIdentifier', 'data', 'options'],
  validatorsByArg: {
    spreadsheetIdentifier: p => objHasAny(p, ['spreadsheetId', 'spreadsheetHandle']),
    data: p => objHasAny(p, ['objArray']),
  },
});

module.exports = {
  googlesheetsSpreadsheetSheetAdd,
  googlesheetsSpreadsheetSheetAddApi,
};

// curl localhost:8000/googlesheetsSpreadsheetSheetAdd -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1RuI7MrZ0VPGBLd4EXRIfDy7DVdtcdDKKbA8C5UBJQTM" }, "data": { "objArray": [{ "fruit": "apple", "colour": "red" }, { "fruit": "kiwi", "colour": "green" }] } }, "options": { "sheetName": "Fruits <3" } }'

