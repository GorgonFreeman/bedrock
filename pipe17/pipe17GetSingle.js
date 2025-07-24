const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const pipe17GetSingle = async (
  resource,
  id,
  {
    credsPath,
    resources,
    idDecorator,
  } = {},
) => {

  resources = resources || `${ resource }s`;

  const response = await pipe17Client.fetch({
    url: `/${ resources }/${ idDecorator ?? '' }${ id }`,
    factoryArgs: [credsPath],
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result[resource],
        } : {},
      };
    },
  });
  
  logDeep(response);
  return response;
};

const pipe17GetSingleApi = async (req, res) => {
  const { 
    resource,
    id,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'resource', resource),
    mandateParam(res, 'id', id),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17GetSingle(
    resource,
    id,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17GetSingle,
  pipe17GetSingleApi,
};

// curl localhost:8000/pipe17GetSingle -H "Content-Type: application/json" -d '{ "resource": "receipt", "id": "b9d03991a844e340" }'