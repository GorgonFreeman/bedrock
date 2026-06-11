const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitWebhookTrackingEventHandle = async (
  credsPath,
  arg,
) => {

  const response = await starshipitClient.fetch({
    url: '/things',
    params: {
      arg_value: arg,
    },
    context: {
      credsPath,
    },
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.arg_value,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const starshipitWebhookTrackingEventHandleApi = funcApi(starshipitWebhookTrackingEventHandle, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  starshipitWebhookTrackingEventHandle,
  starshipitWebhookTrackingEventHandleApi,
};

// curl localhost:8000/starshipitWebhookTrackingEventHandle -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 