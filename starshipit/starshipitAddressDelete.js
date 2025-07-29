// https://api-docs.starshipit.com/#4f93a04a-c4db-40bf-86d5-f4f8fd3fb265

const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitAddressDelete = async (
  credsPath,
  {
    addressId,
  },
) => {

  const response = await starshipitClient.fetch({
    url: '/addressbook/delete',
    method: 'delete',
    params: {
      address_id: addressId,
    },
    factoryArgs: [{ credsPath }],
  });

  logDeep(response);
  return response;
};

const starshipitAddressDeleteApi = async (req, res) => {
  const { 
    credsPath,
    addressIdentifier,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'addressIdentifier', addressIdentifier, p => p.addressId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitAddressDelete(
    credsPath,
    addressIdentifier,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitAddressDelete,
  starshipitAddressDeleteApi,
};

// curl localhost:8000/starshipitAddressDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "addressIdentifier": { "addressId": "123" } }' 