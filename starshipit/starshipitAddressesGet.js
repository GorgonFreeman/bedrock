const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitGet } = require('../starshipit/starshipit.utils');

const starshipitAddressesGet = async (
  credsPath,
  {
    page = 1,
    perPage,
    sort,
    sortDirection,
  } = {},
) => {

  const response = await starshipitGet(credsPath, '/addressbook/filtered', {
    params: {
      ...(page ? { page } : {}),
      ...(perPage ? { page_size: perPage } : {}),
      ...(sort ? { sort } : {}),
      ...(sortDirection ? { sort_direction: sortDirection } : {}),
    },
  });

  logDeep(response);
  return response;
};

const starshipitAddressesGetApi = async (req, res) => {
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

  const result = await starshipitAddressesGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitAddressesGet,
  starshipitAddressesGetApi,
};

// curl localhost:8000/starshipitAddressesGet -H "Content-Type: application/json" -d '{ "credsPath": "wf" }'
// curl localhost:8000/starshipitAddressesGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "options": { "perPage": 5 } }'