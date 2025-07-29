// https://api-docs.starshipit.com/#f577d747-7227-432f-bbc2-d9e2db08578f

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

      const { result } = response;
      const { id, address } = result || {};

      return {
        ...response,
        ...result ? {
          result: {
            id, 
            ...address,
          },
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

// curl localhost:8000/starshipitAddressCreate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "addressPayload": { "name": "John Doe", "company": "Test Company", "street": "123 Main St", "suburb": "Wherever", "city": "Sydney", "state": "NSW", "post_code": "2000", "country": "Australia", "phone": "0412345678", "email": "john@example.com" } }' 