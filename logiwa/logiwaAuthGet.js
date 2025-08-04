const { respond, mandateParam, credsByPath, customAxios, logDeep } = require('../utils');

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

  const params = {
    apiVersion,
  };

  const url = `${ BASE_URL }/${ apiVersion }/Authorize/token`;

  const response = await customAxios(url, {
    method: 'post',
    body,
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