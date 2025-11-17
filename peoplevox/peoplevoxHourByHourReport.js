const { funcApi, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxHourByHourReport = async (
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

const peoplevoxHourByHourReportApi = funcApi(peoplevoxHourByHourReport, {
  argNames: ['salesOrderNumber', 'options'],
});

module.exports = {
  peoplevoxHourByHourReport,
  peoplevoxHourByHourReportApi,
};

// curl localhost:8000/peoplevoxHourByHourReport -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'