// https://apidoc.pipe17.com/#/operations/createJob

const { funcApi, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17JobCreate = async (
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

const pipe17JobCreateApi = funcApi(pipe17JobCreate, {
  argNames: ['receiptId', 'options'],
});

module.exports = {
  pipe17JobCreate,
  pipe17JobCreateApi,
};

// curl localhost:8000/pipe17JobCreate -H "Content-Type: application/json" -d '{ "receiptId": "b9d03991a844e340" }'