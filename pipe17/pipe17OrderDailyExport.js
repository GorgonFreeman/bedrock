const { funcApi, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17OrderDailyExport = async (
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

const pipe17OrderDailyExportApi = funcApi(pipe17OrderDailyExport, {
  argNames: ['receiptId', 'options'],
});

module.exports = {
  pipe17OrderDailyExport,
  pipe17OrderDailyExportApi,
};

// curl localhost:8000/pipe17OrderDailyExport -H "Content-Type: application/json" -d '{ "receiptId": "b9d03991a844e340" }'