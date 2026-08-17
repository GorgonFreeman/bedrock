const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');

const googlesheetsSpreadsheetSheetDelete = async (
  {
    spreadsheetId,
    spreadsheetHandle,
  },
  {
    sheetName,
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

  if (sheetName === undefined && sheetId === undefined) {
    return {
      success: false,
      errors: ['Must provide sheetName or sheetId'],
    };
  }

  const sheetsClient = getGoogleSheetsClient({ credsPath });

  // Resolve sheetId from sheetName if needed
  let resolvedSheetId = sheetId;
  let resolvedSheetName = sheetName !== undefined ? String(sheetName) : undefined;

  if (resolvedSheetId === undefined || resolvedSheetName === undefined) {
    const { data: spreadsheetData } = await sheetsClient.spreadsheets.get({
      spreadsheetId,
    });

    const { sheets: sheetsArray } = spreadsheetData;

    if (!sheetsArray || sheetsArray.length === 0) {
      return {
        success: false,
        errors: ['No sheets found in spreadsheet'],
      };
    }

    if (resolvedSheetId === undefined) {
      const sheet = sheetsArray.find(s => s.properties.title === resolvedSheetName);
      if (!sheet) {
        return {
          success: false,
          errors: [`Sheet with name "${ resolvedSheetName }" not found`],
        };
      }
      resolvedSheetId = sheet.properties.sheetId;
    }

    if (resolvedSheetName === undefined) {
      const sheet = sheetsArray.find(s => s.properties.sheetId === resolvedSheetId);
      if (!sheet) {
        return {
          success: false,
          errors: [`Sheet with ID ${ resolvedSheetId } not found`],
        };
      }
      resolvedSheetName = sheet.properties.title;
    }
  }

  const { data: batchUpdateResponse } = await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [
        {
          deleteSheet: {
            sheetId: resolvedSheetId,
          },
        },
      ],
    },
  });

  return {
    success: true,
    result: {
      spreadsheetId,
      sheetId: resolvedSheetId,
      sheetName: resolvedSheetName,
      batchUpdateResponse,
    },
  };
};

const googlesheetsSpreadsheetSheetDeleteApi = funcApi(googlesheetsSpreadsheetSheetDelete, {
  argNames: ['spreadsheetIdentifier', 'sheetIdentifier', 'options'],
  validatorsByArg: {
    spreadsheetIdentifier: p => objHasAny(p, ['spreadsheetId', 'spreadsheetHandle']),
    sheetIdentifier: p => objHasAny(p, ['sheetName', 'sheetId']),
  },
});

module.exports = {
  googlesheetsSpreadsheetSheetDelete,
  googlesheetsSpreadsheetSheetDeleteApi,
};

// curl localhost:8000/googlesheetsSpreadsheetSheetDelete -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetHandle": "us_audit_sheet" }, "sheetIdentifier": { "sheetName": "2026-08-12" } }'
// curl localhost:8000/googlesheetsSpreadsheetSheetDelete -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1RuI7MrZ0VPGBLd4EXRIfDy7DVdtcdDKKbA8C5UBJQTM" }, "sheetIdentifier": { "sheetId": 123456789 } }'
