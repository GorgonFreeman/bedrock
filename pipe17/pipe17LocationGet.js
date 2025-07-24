const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17LocationGet = async (
  locationId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'location',
    locationId,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17LocationGetApi = async (req, res) => {
  const { 
    locationId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'locationId', locationId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17LocationGet(
    locationId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17LocationGet,
  pipe17LocationGetApi,
};

// curl localhost:8000/pipe17LocationGet -H "Content-Type: application/json" -d '{ "locationId": "6d9c18617ea2d279" }'