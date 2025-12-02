// https://peoplevox.help.descartesservices.com/en/integrations/peoplevox-api-guide/event-subscriptions~7394583284341177322#unsubscribeevent

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxSubscriptionUnsubscribeSingle = async (
  subscriptionId,
  {
    credsPath,
  } = {},
) => {

  const action = 'UnsubscribeEvent';

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': `http://www.peoplevox.net/${ action }`,
    },
    method: 'post',
    body: {
      UnsubscribeEvent: {
        subscriptionId,
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

const peoplevoxSubscriptionUnsubscribe = async (
  subscriptionId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  return actionMultipleOrSingle(
    subscriptionId,
    peoplevoxSubscriptionUnsubscribeSingle,
    (subscriptionId) => ({
      args: [subscriptionId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const peoplevoxSubscriptionUnsubscribeApi = funcApi(peoplevoxSubscriptionUnsubscribe, {
  argNames: ['subscriptionId', 'options'],
});

module.exports = {
  peoplevoxSubscriptionUnsubscribe,
  peoplevoxSubscriptionUnsubscribeApi,
};

// curl localhost:8000/peoplevoxSubscriptionUnsubscribe -H "Content-Type: application/json" -d '{ "subscriptionId": "1060" }'
// curl localhost:8000/peoplevoxSubscriptionUnsubscribe -H "Content-Type: application/json" -d '{ "subscriptionId": ["1000", "1001", "1002", ...] }'

