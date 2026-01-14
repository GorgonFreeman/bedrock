const { funcApi, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17JobDo = async (
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

const pipe17JobDoApi = funcApi(pipe17JobDo, {
  argNames: ['receiptId', 'options'],
});

module.exports = {
  pipe17JobDo,
  pipe17JobDoApi,
};

// curl localhost:8000/pipe17JobDo -H "Content-Type: application/json" -d '{ "receiptId": "b9d03991a844e340" }'