const { funcApi, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17OrdersGet = async (
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

const pipe17OrdersGetApi = funcApi(pipe17OrdersGet, {
  argNames: ['receiptId', 'options'],
});

module.exports = {
  pipe17OrdersGet,
  pipe17OrdersGetApi,
};

// curl localhost:8000/pipe17OrdersGet -H "Content-Type: application/json" -d '{ "receiptId": "b9d03991a844e340" }'