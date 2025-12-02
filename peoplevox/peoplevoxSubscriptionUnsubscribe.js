const { funcApi, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxSubscriptionUnsubscribe = async (
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

const peoplevoxSubscriptionUnsubscribeApi = funcApi(peoplevoxSubscriptionUnsubscribe, {
  argNames: ['salesOrderNumber', 'options'],
});

module.exports = {
  peoplevoxSubscriptionUnsubscribe,
  peoplevoxSubscriptionUnsubscribeApi,
};

// curl localhost:8000/peoplevoxSubscriptionUnsubscribe -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'