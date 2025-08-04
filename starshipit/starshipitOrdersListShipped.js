const { respond, mandateParam, logDeep, askQuestion } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitOrdersListShipped = async (
  credsPath,
  {
    sinceLastUpdated,
    idsOnly,
    perPage,
    limit,
  } = {},
) => {

  const response = await starshipitClient.fetch({
    url: '/orders/shipped',
    params: {
      ...(sinceLastUpdated ? { since_last_updated: sinceLastUpdated } : {}),
      ...(idsOnly ? { ids_only: idsOnly } : {}),
      ...(perPage ? { limit: perPage } : {}),
    },
    ...(limit ? { limit } : {}),
    context: {
      credsPath,
    },
    interpreter: async (response) => {
      console.log(response);
      await askQuestion('?');

      return {
        ...response,
        ...response.result ? {
          result: response.result?.orders || response.result?.order_ids,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const starshipitOrdersListShippedApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitOrdersListShipped(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrdersListShipped,
  starshipitOrdersListShippedApi,
};

// curl localhost:8000/starshipitOrdersListShipped -H "Content-Type: application/json" -d '{ "credsPath": "wf" }' 