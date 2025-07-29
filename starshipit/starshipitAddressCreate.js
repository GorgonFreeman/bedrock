// https://api-docs.starshipit.com/#4f93a04a-c4db-40bf-86d5-f4f8fd3fb265

const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitAddressCreate = async (
  credsPath,
  addressPayload,
) => {

  const response = await starshipitClient.fetch({
    url: '/addressbook',
    method: 'post',
    body: {
      address: addressPayload,
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

const starshipitAddressCreateApi = async (req, res) => {
  const { 
    credsPath,
    addressPayload,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'addressPayload', addressPayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitAddressCreate(
    credsPath,
    addressPayload,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitAddressCreate,
  starshipitAddressCreateApi,
};

// curl localhost:8000/starshipitAddressCreate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "addressPayload": { "name": "John Doe", "company": "Test Company", "address1": "123 Main St", "city": "Sydney", "state": "NSW", "postcode": "2000", "country": "AU", "phone": "0412345678", "email": "john@example.com" } }' 