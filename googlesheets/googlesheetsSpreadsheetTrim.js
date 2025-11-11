const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');

const googlesheetsSpreadsheetTrim = async (
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

  // Get spreadsheet metadata to find all sheets
  const { data: spreadsheetData } = await sheetsClient.spreadsheets.get({
    spreadsheetId,
  });

  const { sheets: sheetsArray } = spreadsheetData;

  if (!sheetsArray || sheetsArray.length === 0) {
    return {
      success: true,
      message: 'No sheets found in spreadsheet',
      trimmed: [],
    };
  }

  // Process all sheets to determine what needs trimming
  const trimRequests = [];
  const sheetResults = [];

  for (const sheet of sheetsArray) {
    const { properties } = sheet;
    const { sheetId, title: sheetTitle, gridProperties } = properties;
    const { rowCount, columnCount } = gridProperties || {};

    if (!rowCount || !columnCount) {
      continue;
    }

    // Get values for this sheet
    const { data: valuesData } = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: `${ sheetTitle }!A:ZZ`,
    });

    const { values } = valuesData || {};

    if (!values || values.length === 0) {
      // Sheet is empty, trim everything except first row and column
      if (rowCount > 1) {
        trimRequests.push({
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
            },
          },
        });
      }
      if (columnCount > 1) {
        trimRequests.push({
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'COLUMNS',
              startIndex: 1,
            },
          },
        });
      }
      if (rowCount > 1 || columnCount > 1) {
        sheetResults.push({
          sheetTitle,
          sheetId,
          trimmed: true,
          originalRows: rowCount,
          originalColumns: columnCount,
          newRows: 1,
          newColumns: 1,
        });
      }
      continue;
    }

    // Find max rows and columns with data
    let maxRows = values.length;
    // More efficient: find max column length without sorting entire array
    let maxCols = 0;
    for (const row of values) {
      if (row && row.length > maxCols) {
        maxCols = row.length;
      }
    }

    // Ensure at least 1 row and 1 column
    maxRows = Math.max(1, maxRows);
    maxCols = Math.max(1, maxCols);

    // Add delete requests if needed
    if (rowCount > maxRows) {
      trimRequests.push({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: maxRows,
          },
        },
      });
    }

    if (columnCount > maxCols) {
      trimRequests.push({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: maxCols,
          },
        },
      });
    }

    if (rowCount > maxRows || columnCount > maxCols) {
      sheetResults.push({
        sheetTitle,
        sheetId,
        trimmed: true,
        originalRows: rowCount,
        originalColumns: columnCount,
        newRows: maxRows,
        newColumns: maxCols,
      });
    } else {
      sheetResults.push({
        sheetTitle,
        sheetId,
        trimmed: false,
        message: 'No trimming needed',
      });
    }
  }

  // Execute all delete requests in a single batch update if any
  let batchUpdateResult = null;
  if (trimRequests.length > 0) {
    const { data } = await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: trimRequests,
      },
    });
    batchUpdateResult = data;
  }

  return {
    success: true,
    sheetsProcessed: sheetsArray.length,
    sheetsTrimmed: sheetResults.filter(s => s.trimmed).length,
    sheetResults,
    batchUpdateResult,
  };
};

const googlesheetsSpreadsheetTrimApi = funcApi(googlesheetsSpreadsheetTrim, {
  argNames: ['spreadsheetIdentifier', 'options'],
  validatorsByArg: {
    spreadsheetIdentifier: p => objHasAny(p, ['spreadsheetId', 'spreadsheetHandle']),
  },
});

module.exports = {
  googlesheetsSpreadsheetTrim,
  googlesheetsSpreadsheetTrimApi,
};

// curl localhost:8000/googlesheetsSpreadsheetTrim -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1RuI7MrZ0VPGBLd4EXRIfDy7DVdtcdDKKbA8C5UBJQTM" } }'

