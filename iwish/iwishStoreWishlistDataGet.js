const { respond, mandateParam, credsByPath, CustomAxiosClient, logDeep } = require('../utils');
const { iwishGet } = require('../iwish/iwish.utils');

const iwishStoreWishlistDataGet = async (
  credsPath,
  {
    ...getterOptions
  } = {},
) => {

  const response = await iwishGet(
    '/V2/storeWishlistData',
    credsPath,
    {
      ...getterOptions
    },
  );
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