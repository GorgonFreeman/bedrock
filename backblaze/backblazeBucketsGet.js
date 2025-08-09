const { respond, mandateParam, credsByPath, customAxios } = require('../utils');

const backblazeBucketsGet = async (
  accountId,
  {
    verbose = false,
  } = {},
) => {
  const creds = credsByPath('backblaze');
  console.log('backblaze creds', creds);

  // Step 1: Authorize account to get token
  const authUrl = `${creds.BASE_URL}/b2api/v2/b2_authorize_account`;
  const authHeaders = {
    'Authorization': `Basic ${Buffer.from(`${creds.APP_ID}:${creds.API_KEY}`).toString('base64')}`,
  };

  console.log('backblaze authUrl', authUrl);
  console.log('backblaze authHeaders', authHeaders);

  const authResponse = await customAxios(authUrl, {
    method: 'get',
    headers: authHeaders,
    verbose,
  });

  if (!authResponse.success) {
    console.error('backblaze auth failed', authResponse.error);
    return {
      success: false,
      error: authResponse.error,
    };
  }

  const { accountAuthToken, apiUrl } = authResponse.result;
  console.log('backblaze auth success', { accountAuthToken: accountAuthToken?.substring(0, 20) + '...', apiUrl });

  // Step 2: List buckets using the auth token
  const bucketsUrl = `${apiUrl}/b2api/v2/b2_list_buckets`;
  const bucketsHeaders = {
    'Authorization': accountAuthToken,
  };

  console.log('backblaze bucketsUrl', bucketsUrl);
  console.log('backblaze bucketsHeaders', bucketsHeaders);

  const bucketsResponse = await customAxios(bucketsUrl, {
    method: 'post',
    headers: bucketsHeaders,
    body: {
      accountId: creds.ACCOUNT_ID,
    },
    verbose,
  });

  if (!bucketsResponse.success) {
    console.error('backblaze buckets failed', bucketsResponse.error);
    return {
      success: false,
      error: bucketsResponse.error,
    };
  }

  console.log('backblaze buckets success', bucketsResponse.result);
  return {
    success: true,
    result: bucketsResponse.result,
  };
};

const backblazeBucketsGetApi = async (req, res) => {
  const { 
    accountId,
    options = {},
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'accountId', accountId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await backblazeBucketsGet(
    accountId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  backblazeBucketsGet,
  backblazeBucketsGetApi,
};

// curl localhost:8000/backblazeBucketsGet -H "Content-Type: application/json" -d '{ "accountId": "your_account_id" }'