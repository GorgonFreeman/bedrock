// https://apidoc.pipe17.com/#/operations/fetchJob

const { funcApi, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17JobGet = async (
  jobId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17Client.fetch({
    url: `/jobs/${ jobId }`,
    context: {
      credsPath,
    },
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.job,
        } : {},
      };
    },
  });
  
  logDeep(response);
  return response;
};

const pipe17JobGetApi = funcApi(pipe17JobGet, {
  argNames: ['jobId', 'options'],
});

module.exports = {
  pipe17JobGet,
  pipe17JobGetApi,
};

// curl localhost:8000/pipe17JobGet -H "Content-Type: application/json" -d '{ "jobId": "eb7586ac111d3afb" }'