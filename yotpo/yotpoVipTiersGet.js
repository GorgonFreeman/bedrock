// https://loyaltyapi.yotpo.com/reference/fetch-vip-tiers
 
const { respond, mandateParam, logDeep } = require('../utils');
const { yotpoClientV2 } = require('../yotpo/yotpo.utils');

console.log(yotpoClientV2);

const yotpoVipTiersGet = async (
  credsPath,
  {
    apiVersion,
  } = {},
) => {

  const response = await yotpoClientV2.fetch({
    url: `/vip_tiers`,
    context: {
      credsPath,
      apiVersion,
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