const { respond, mandateParam, credsByPath, customAxios, logDeep } = require('../utils');

const pipe17ReturnGet = async (
  returnId,
  {
    credsPath,
  } = {},
) => {

  const creds = credsByPath(['pipe17', credsPath]);
  const { 
    BASE_URL,
    API_KEY,
  } = creds;

  const headers = {
    'X-Pipe17-Key': `${ API_KEY }`,
    'Content-Type': 'application/json',
  };

  const url = `${ BASE_URL }/returns/${ returnId }`;

  const response = await customAxios(url, {
    headers,
  });
  
  logDeep(response);
  return response;
};

const pipe17ReturnGetApi = async (req, res) => {
  const { 
    returnId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'returnId', returnId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17ReturnGet(
    returnId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ReturnGet,
  pipe17ReturnGetApi,
};

// curl localhost:8000/pipe17ReturnGet -H "Content-Type: application/json" -d '{ "returnId": "969504fc181f7182" }'