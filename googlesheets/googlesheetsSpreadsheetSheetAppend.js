// https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append

const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');

const googlesheetsSpreadsheetSheetAppend = async (
  {
    spreadsheetId,
    spreadsheetHandle,
  },
  {
    objArray,
    headers,
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

  if (!sheetName) {
    return {
      success: false,
      errors: ['sheetName is required for append'],
    };
  }

  if (!objArray?.length) {
    return {
      success: true,
      result: { rowsAppended: 0 },
    };
  }

  const sheetsClient = getGoogleSheetsClient({ credsPath });

  // If headers are provided use them, otherwise derive from first object's keys.
  const resolvedHeaders = headers || Object.keys(objArray[0]);

  const rows = objArray.map(obj =>
    resolvedHeaders.map(header => {
      const value = obj?.[header];
      return value === null || value === undefined ? '' : value;
    }),
  );

  const { data: appendResponse } = await sheetsClient.spreadsheets.values.append({
    spreadsheetId,
    range: `${ sheetName }!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: rows,
    },
  });

  return {
    success: true,
    result: {
      rowsAppended: rows.length,
      updatedRange: appendResponse?.updates?.updatedRange,
    },
  };
};

const googlesheetsSpreadsheetSheetAppendApi = funcApi(googlesheetsSpreadsheetSheetAppend, {
  argNames: ['spreadsheetIdentifier', 'data', 'options'],
  validatorsByArg: {
    spreadsheetIdentifier: p => objHasAny(p, ['spreadsheetId', 'spreadsheetHandle']),
    data: p => objHasAny(p, ['objArray']),
  },
});

module.exports = {
  googlesheetsSpreadsheetSheetAppend,
  googlesheetsSpreadsheetSheetAppendApi,
};

// curl localhost:8000/googlesheetsSpreadsheetSheetAppend -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetHandle": "store_credit" }, "data": { "objArray": [{ "accountId": "123", "balance": "50.00" }] }, "options": { "sheetName": "au-ledger-20260518-1000" } }'
