const { funcApi, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxItemsEdit = async (
  salesOrderNumber,
  {
    credsPath,
  } = {},
) => {

  const action = 'GetData';

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': `http://www.peoplevox.net/${ action }`,
    },
    method: 'post',
    body: {
      getRequest: {
        TemplateName: 'Sales orders',
        SearchClause: `SalesOrderNumber.Equals("${ salesOrderNumber }")`,
      },
    },
    context: { 
      credsPath,
      action,
     },
    interpreter: peoplevoxStandardInterpreter({ expectOne: true }),
  });
  logDeep(response);
  return response;
  
};

const peoplevoxItemsEditApi = funcApi(peoplevoxItemsEdit, {
  argNames: ['salesOrderNumber', 'options'],
});

module.exports = {
  peoplevoxItemsEdit,
  peoplevoxItemsEditApi,
};

// curl localhost:8000/peoplevoxItemsEdit -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'