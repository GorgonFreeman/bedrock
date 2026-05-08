const { funcApi, objHasAny } = require('../utils');
const { getGoogleSheetsClient } = require('../googlesheets/googlesheets.utils');
const { googlesheetsSpreadsheetGet } = require('../googlesheets/googlesheetsSpreadsheetGet');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');

const googlesheetsSpreadsheetSheetDelete = async (
  {
    spreadsheetId,
    spreadsheetHandle,
  },
  {
    sheetId,
    sheetName,
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

  if (!sheetId) {

    // Fetch the spreadsheet
    const spreadsheetGetResponse = await googlesheetsSpreadsheetGet({ spreadsheetId }, { credsPath });
    if (!spreadsheetGetResponse) {
      return {
        success: false,
        errors: ['Error getting spreadsheet'],
      };
    }

    // Get the sheets array
    const { sheets: sheetsArray } = spreadsheetGetResponse.data;
    if (!sheetsArray || sheetsArray.length === 0) {
      return {
        success: false,
        errors: ['No sheets found in spreadsheet'],
      };
    }

    // Find the sheet by name
    if (sheetName) {
      const sheet = sheetsArray.find(s => s.properties.title === sheetName);
      if (!sheet) {
        return {
          success: false,
          errors: [`Sheet with name ${ sheetName } not found`],
        };
      }
      // Set the sheet ID that belongs to the sheet with the given name
      sheetId = sheet.properties.sheetId;
    }
  }

  // Delete the sheet in a batch operation
  const response = await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [
        {
          deleteSheet: {
            sheetId,
          },
        },
      ],
    },
  });

  return {
    success: true,
    result: response.data,
  };
};

const googlesheetsSpreadsheetSheetDeleteApi = funcApi(googlesheetsSpreadsheetSheetDelete, {
  argNames: ['spreadsheetIdentifier', 'sheetIdentifier', 'options'],
  validatorsByArg: {
    spreadsheetIdentifier: p => objHasAny(p, ['spreadsheetId', 'spreadsheetHandle']),
    sheetIdentifier: p => objHasAny(p, ['sheetId', 'sheetName']),
  },
});

module.exports = {
  googlesheetsSpreadsheetSheetDelete,
  googlesheetsSpreadsheetSheetDeleteApi,
};

// curl localhost:8000/googlesheetsSpreadsheetSheetDelete -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "16c0PhmELzAEgEEWhJACEfHneGTjLxnrjzzH8UkDCswU" }, "sheetIdentifier": { "sheetName": "Fruits <3" } }'

