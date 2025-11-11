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

  // Filter sheets with valid grid properties and prepare ranges for batch fetch
  const sheetsToProcess = sheetsArray
    .map(sheet => {
      const { properties } = sheet;
      const { sheetId, title: sheetTitle, gridProperties } = properties;
      const { rowCount, columnCount } = gridProperties || {};
      
      if (!rowCount || !columnCount) {
        return null;
      }
      
      return {
        sheetId,
        sheetTitle,
        rowCount,
        columnCount,
      };
    })
    .filter(Boolean);

  if (sheetsToProcess.length === 0) {
    return {
      success: true,
      message: 'No sheets with valid grid properties found',
      sheetsProcessed: sheetsArray.length,
      sheetsTrimmed: 0,
      sheetResults: [],
    };
  }

  // Fetch all sheet values in a single batch API call (much more efficient)
  const { data: batchValuesData } = await sheetsClient.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: sheetsToProcess.map(sheet => `${ sheet.sheetTitle }!A:ZZ`),
  });

  const { valueRanges } = batchValuesData;

  // Process each sheet's data to determine trimming needs
  const trimRequests = [];
  const sheetResults = [];

  for (let i = 0; i < sheetsToProcess.length; i++) {
    const sheet = sheetsToProcess[i];
    const { sheetId, sheetTitle, rowCount, columnCount } = sheet;
    const valueRange = valueRanges[i];
    const { values } = valueRange || {};

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
      } else {
        sheetResults.push({
          sheetTitle,
          sheetId,
          trimmed: false,
          message: 'No trimming needed',
        });
      }
      continue;
    }

    // Find max rows and columns with data
    let maxRows = values.length;
    // Efficient: find max column length in single pass
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

// curl localhost:8000/googlesheetsSpreadsheetTrim -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1k1auuh73VEjq4g-jwKlfszexBZMsf5nFhQWaAQgmyVM" } }'

