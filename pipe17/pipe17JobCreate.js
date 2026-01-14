// https://apidoc.pipe17.com/#/operations/createJob

const { funcApi, logDeep } = require('../utils');
const { JOB_TYPES, JOB_SUBTYPES } = require('../pipe17/pipe17.constants');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17JobCreate = async (
  type,
  subType,
  {
    credsPath,
    
    // Options directly for the API
    contentType,
    internal,
    params,
    state,
    tags,
    timeout,

  } = {},
) => {

  const response = await pipe17Client.fetch({
    url: '/jobs',
    method: 'post',
    body: {
      type,
      subType,
      ...contentType && { contentType },
      ...internal && { internal },
      ...params && { params },
      ...state && { state },
      ...tags && { tags },
      ...timeout && { timeout },
    },
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

const pipe17JobCreateApi = funcApi(pipe17JobCreate, {
  argNames: ['type', 'subType', 'options'],
  validatorsByArg: {
    type: (p) => JOB_TYPES.includes(p),
    subType: (p) => JOB_SUBTYPES.includes(p),
  },
});

module.exports = {
  pipe17JobCreate,
  pipe17JobCreateApi,
};

// curl localhost:8000/pipe17JobCreate -H "Content-Type: application/json" -d '{ "type": "report", "subType": "orders", "options": { "params": { "emails": ["ozymandias@karnak.aq"] } } }'
