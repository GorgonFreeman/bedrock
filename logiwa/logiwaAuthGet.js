// https://mydeveloper.logiwa.com/#tag/Authorize/paths/~1v3.1~1Authorize~1token/post

const { respond, mandateParam, credsByPath, logDeep, CustomAxiosClient } = require('../utils');

const logiwaAuthGet = async (
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const creds = credsByPath(['logiwa', credsPath]);

  const {
    BASE_URL,
    LOGIN_EMAIL,
    LOGIN_PASSWORD,
  } = creds;

  const body = {
    email: LOGIN_EMAIL,
    password: LOGIN_PASSWORD,
  };

  const client = new CustomAxiosClient({
    baseUrl: `${ BASE_URL }/${ apiVersion }`,
  });

  const response = await client.fetch({
    method: 'post',
    url: '/Authorize/token', 
    body,
    interpreter: (response) => {
      return {
        ...response,
        ...(response?.result?.token ? {
          result: response?.result?.token,
        } : {}),
      };
    }
  });

  logDeep(response);
  return response;
  
};

const logiwaAuthGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await logiwaAuthGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaAuthGet,
  logiwaAuthGetApi,
};

// curl localhost:8000/logiwaAuthGet