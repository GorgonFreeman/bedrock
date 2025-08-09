// https://www.backblaze.com/b2/docs/b2_authorize_account.html

const { respond, mandateParam, logDeep, credsByPath, customAxios } = require('../utils');

const backblazeAuthGet = async (
  {
    credsPath,
  } = {},
) => {
  
  const creds = credsByPath(['backblaze', credsPath]);

  // Authorize account to get token and account info
  const authUrl = `${creds.BASE_URL}/b2api/v2/b2_authorize_account`;
  const authHeaders = {
    'Authorization': `Basic ${Buffer.from(`${creds.APP_ID}:${creds.API_KEY}`).toString('base64')}`,
  };

  console.log('backblaze authUrl', authUrl);
  console.log('backblaze authHeaders', authHeaders);

  const authResponse = await customAxios(authUrl, {
    method: 'get',
    headers: authHeaders,
  });

  if (!authResponse.success) {
    console.error('backblaze auth failed', authResponse);
    return authResponse;
  }

  console.log('backblaze auth success', authResponse.data);
  logDeep(authResponse);
  return authResponse;
};

const backblazeAuthGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await backblazeAuthGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  backblazeAuthGet,
  backblazeAuthGetApi,
};

// curl localhost:8000/backblazeAuthGet 