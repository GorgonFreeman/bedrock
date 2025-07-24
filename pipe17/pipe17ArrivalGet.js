const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17ArrivalGet = async (
  extArrivalId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'arrival',
    extArrivalId,
    {
      credsPath,
      idDecorator: 'ext:',
    },
  );  
  logDeep(response);
  return response;
};

const pipe17ArrivalGetApi = async (req, res) => {
  const { 
    extArrivalId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'extArrivalId', extArrivalId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17ArrivalGet(
    extArrivalId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ArrivalGet,
  pipe17ArrivalGetApi,
};

// curl localhost:8000/pipe17ArrivalGet -H "Content-Type: application/json" -d '{ "extArrivalId": "US-WF-044-B" }'