// https://api-docs.starshipit.com/#4f93a04a-c4db-40bf-86d5-f4f8fd3fb265

const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitAddressUpdate = async (
  credsPath,
  {
    addressId,
  },
  updatePayload,
) => {

  const response = await starshipitClient.fetch({
    url: '/addressbook',
    method: 'put',
    body: {
      address: {
        address_id: addressId,
        ...updatePayload,
      },
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
    addressIdentifier,
    updatePayload,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'addressIdentifier', addressIdentifier, p => p.addressId),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitAddressUpdate(
    credsPath,
    addressIdentifier,
    updatePayload,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitAddressUpdate,
  starshipitAddressUpdateApi,
};

// curl localhost:8000/starshipitAddressUpdate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "addressIdentifier": { "addressId": "123" }, "updatePayload": { "name": "Jane Doe", "phone": "0498765432" } }' 