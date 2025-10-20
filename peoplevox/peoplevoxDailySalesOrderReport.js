const { funcApi, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxDailySalesOrderReport = async (
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

const peoplevoxDailySalesOrderReportApi = funcApi(peoplevoxDailySalesOrderReport, {
  argNames: ['salesOrderNumber', 'options'],
});

module.exports = {
  peoplevoxDailySalesOrderReport,
  peoplevoxDailySalesOrderReportApi,
};

// curl localhost:8000/peoplevoxDailySalesOrderReport -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'