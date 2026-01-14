// https://apidoc.pipe17.com/#/operations/fetchJobResults

const { funcApi, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17JobResultsGet = async (
  jobId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17Client.fetch({
    url: `/jobs/${ jobId }/results`,
    context: {
      credsPath,
    },
    // interpreter: (response) => {
    //   return {
    //     ...response,
    //     ...response.result ? {
    //       result: response.result.receipt,
    //     } : {},
    //   };
    // },
  });
  
  logDeep(response);
  return response;
};

const pipe17JobResultsGetApi = funcApi(pipe17JobResultsGet, {
  argNames: ['jobId', 'options'],
});

module.exports = {
  pipe17JobResultsGet,
  pipe17JobResultsGetApi,
};

// curl localhost:8000/pipe17JobResultsGet -H "Content-Type: application/json" -d '{ "jobId": "eb7586ac111d3afb" }'