// https://api-docs.starshipit.com/#4ff9ae6f-fadb-4c50-9087-467c2e336f93

const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitAddressUpdate = async (
  credsPath,
  addressId,
  updatePayload,
) => {

  const response = await starshipitClient.fetch({
    url: '/addressbook/update',
    method: 'post',
    body: {
      id: addressId,
      address: updatePayload,
    },
    factoryArgs: [{ credsPath }],
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.address,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const starshipitAddressUpdateApi = async (req, res) => {
  const { 
    credsPath,
    addressId,
    updatePayload,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'addressId', addressId),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitAddressUpdate(
    credsPath,
    addressId,
    updatePayload,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitAddressUpdate,
  starshipitAddressUpdateApi,
};

// curl localhost:8000/starshipitAddressUpdate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "addressId": 14824685, "updatePayload": { "name": "Batman" } }'