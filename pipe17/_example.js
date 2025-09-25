const { funcApi, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const FUNC = async (
  receiptId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17Client.fetch({
    url: `/receipts/${ receiptId }`,
    context: {
      credsPath,
    },
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.receipt,
        } : {},
      };
    },
  });
  
  logDeep(response);
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['receiptId'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "receiptId": "b9d03991a844e340" }'