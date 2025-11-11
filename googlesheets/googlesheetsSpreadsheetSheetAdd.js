const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');
const { googlesheetsSpreadsheetTrim } = require('../googlesheets/googlesheetsSpreadsheetTrim');

const googlesheetsSpreadsheetSheetAdd = async (
  {
    spreadsheetId,
    spreadsheetHandle,
  },
  {
    objArray,
  },
  {
    sheetName = Date.now(),
    credsPath,
    trim = true,
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

  // Collect all unique keys from all objects to create headers
  const allKeys = new Set();
  for (const obj of objArray) {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => allKeys.add(key));
    }
  }
  const headers = Array.from(allKeys);

  if (headers.length === 0) {
    return {
      success: false,
      errors: ['objArray contains no valid objects with keys'],
    };
  }

  // Convert array of objects to 2D array (rows)
  const values = [
    headers, // Header row
    ...objArray.map(obj => {
      return headers.map(header => {
        const value = obj?.[header];
        // Convert null/undefined to empty string for Google Sheets
        return value === null || value === undefined ? '' : value;
      });
    }),
  ];

  // Add the new sheet and write data in a batch operation
  const { data: batchUpdateResponse } = await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    },
  });

  const newSheetId = batchUpdateResponse.replies[0].addSheet.properties.sheetId;

  // Write the data to the new sheet
  const { data: updateResponse } = await sheetsClient.spreadsheets.values.update({
    spreadsheetId,
    range: `${ sheetName }!A1`,
    valueInputOption: 'RAW',
    resource: {
      values,
    },
  });

  if (trim) {
    // Trim, but don't particularly care about the result, and don't hold up response.
    googlesheetsSpreadsheetTrim(
      { spreadsheetId, spreadsheetHandle },
      { credsPath },
    );
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${ spreadsheetId }/edit#gid=${ newSheetId }`;

  return {
    success: true,
    result: {
      sheetId: newSheetId,
      sheetName,
      sheetUrl,
      rowsAdded: values.length,
      columnsAdded: headers.length,
      updateResponse,
    },
  };
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

// curl localhost:8000/googlesheetsSpreadsheetSheetAdd -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1RuI7MrZ0VPGBLd4EXRIfDy7DVdtcdDKKbA8C5UBJQTM" }, "data": { "objArray": [{ "fruit": "apple", "colour": "red", "type": "Fuji" }, { "fruit": "kiwi", "colour": "green", "price": "11.50" }] }, "options": { "sheetName": "Fruits <3" } }'

