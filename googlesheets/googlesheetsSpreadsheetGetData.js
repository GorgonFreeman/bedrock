const { funcApi } = require('../utils');

const googlesheetsSpreadsheetGetData = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const googlesheetsSpreadsheetGetDataApi = funcApi(googlesheetsSpreadsheetGetData, {
  argNames: ['arg', 'options'],
});

module.exports = {
  googlesheetsSpreadsheetGetData,
  googlesheetsSpreadsheetGetDataApi,
};

// curl localhost:8000/googlesheetsSpreadsheetGetData -H "Content-Type: application/json" -d '{ "arg": "1234" }'