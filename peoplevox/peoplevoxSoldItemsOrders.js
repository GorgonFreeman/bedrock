const { funcApi, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxSoldItemsOrders = async (
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

const peoplevoxSoldItemsOrdersApi = funcApi(peoplevoxSoldItemsOrders, {
  argNames: ['salesOrderNumber', 'options'],
});

module.exports = {
  peoplevoxSoldItemsOrders,
  peoplevoxSoldItemsOrdersApi,
};

// curl localhost:8000/peoplevoxSoldItemsOrders -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'