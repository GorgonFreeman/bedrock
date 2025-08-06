const { respond, mandateParam, credsByPath, CustomAxiosClient, logDeep } = require('../utils');

const yotpoVipTiersGet = async (
  credsPath,
  {
    apiVersion = 'v2',
  } = {},
) => {

  const creds = credsByPath(['yotpo', credsPath]);

  const {
    API_KEY,
    GUID,
    MERCHANT_ID,
  } = creds;

  const client = new CustomAxiosClient({
    baseUrl: `https://loyalty.yotpo.com/api/${ apiVersion }`,
    baseHeaders: {
      'Content-Type': 'application/json',
    },
  });

  const response = await client.fetch({
    url: `/vip_tiers`,
    headers: {
      'x-api-key': API_KEY,
      'x-guid': GUID,
    },
  });
  logDeep(response);
  return response;
};

const yotpoVipTiersGetApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await yotpoVipTiersGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoVipTiersGet,
  yotpoVipTiersGetApi,
};

// curl localhost:8000/yotpoVipTiersGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'