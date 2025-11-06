const { json2csv } = require('json-2-csv');
const { funcApi, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxItemsEdit = async (
  itemPayloads,
  {
    credsPath,
  } = {},
) => {

  const action = 'SaveData';

  const csvData = await json2csv(itemPayloads);

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': `http://www.peoplevox.net/${ action }`,
    },
    method: 'post',
    body: {
      saveRequest: {
        TemplateName: 'Item types',
        CsvData: csvData,
      },
    },
    context: { 
      credsPath,
      action,
     },
    interpreter: peoplevoxStandardInterpreter(),
  });
  logDeep(response);
  return response;
  
};

const peoplevoxItemsEditApi = funcApi(peoplevoxItemsEdit, {
  argNames: ['itemPayloads', 'options'],
});

module.exports = {
  peoplevoxItemsEdit,
  peoplevoxItemsEditApi,
};

// curl localhost:8000/peoplevoxItemsEdit -H "Content-Type: application/json" -d '{ "itemPayloads": [{ "ItemCode": "100335-CHC-L", "Attribute7": "ATTR7" }] }'