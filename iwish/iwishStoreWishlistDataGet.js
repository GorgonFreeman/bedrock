const { respond, mandateParam, credsByPath, CustomAxiosClient, logDeep } = require('../utils');
const { iwishClient } = require('../iwish/iwish.utils');

const iwishStoreWishlistDataGet = async (
  credsPath,
  {
    option,
  } = {},
) => {

  const response = await iwishClient.fetch({
    url: '/V2/storeWishlistData',
    context: {
      credsPath,
    },
  });
  logDeep('response', response);
  return response;
};

const iwishStoreWishlistDataGetApi = async (req, res) => {
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

  const result = await iwishStoreWishlistDataGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  iwishStoreWishlistDataGet,
  iwishStoreWishlistDataGetApi,
};

// curl localhost:8000/iwishStoreWishlistDataGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'