const { HOSTED } = require('../constants');
const { funcApi, objHasAny, logDeep } = require('../utils');
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

  // Get spreadsheet metadata to resolve sheet name if needed
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

  // Resolve sheet name from identifier
  let resolvedSheetName = sheetName;
  
  if (!resolvedSheetName) {
    if (sheetId !== undefined) {
      // Find sheet by ID
      const sheet = sheetsArray.find(s => s.properties.sheetId === sheetId);
      if (!sheet) {
        return {
          success: false,
          errors: [`Sheet with ID ${ sheetId } not found`],
        };
      }
      resolvedSheetName = sheet.properties.title;
    } else if (sheetIndex !== undefined) {
      // Find sheet by index
      if (sheetIndex < 0 || sheetIndex >= sheetsArray.length) {
        return {
          success: false,
          errors: [`Sheet index ${ sheetIndex } is out of range (0-${ sheetsArray.length - 1 })`],
        };
      }
      resolvedSheetName = sheetsArray[sheetIndex].properties.title;
    } else {
      // Default to first sheet if no identifier provided
      resolvedSheetName = sheetsArray[0].properties.title;
    }
  }

  // Fetch the data from the sheet
  const { data: valuesData } = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `'${ resolvedSheetName }'!A:ZZ`,
  });

  const { values } = valuesData || {};

  if (!values || values.length === 0) {
    return {
      success: true,
      result: [],
    };
  }

  // First row is headers
  const headers = values[0] || [];
  
  if (headers.length === 0) {
    return {
      success: true,
      result: [],
    };
  }

  // Convert rows to JSON objects
  const dataRows = values.slice(1);
  const result = dataRows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : '';
    });
    return obj;
  });

  !HOSTED && logDeep(result);
  return {
    success: true,
    result,
  };
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

// curl localhost:8000/googlesheetsSpreadsheetSheetGetData -H "Content-Type: application/json" -d '{ "spreadsheetIdentifier": { "spreadsheetId": "1ICbx-3g7Kqhge_Wkt9fi_9m7NGjgOGCOBHyEf0i3mP8" }, "sheetIdentifier": { "sheetName": "Sheet 1" } }'

