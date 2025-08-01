// https://api-docs.starshipit.com/#0cd0b1b0-7ba4-4da3-8c94-67cb4e020a6d

const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitAddressDelete = async (
  credsPath,
  addressId,
) => {

  const response = await starshipitClient.fetch({
    url: '/addressbook/delete',
    method: 'post',
    body: {
      address_ids: [addressId],
    },
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const starshipitAddressDeleteApi = async (req, res) => {
  const { 
    credsPath,
    addressId,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'addressId', addressId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitAddressDelete(
    credsPath,
    addressId,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitAddressDelete,
  starshipitAddressDeleteApi,
};

// curl localhost:8000/starshipitAddressDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "addressId": "14824686" }' 