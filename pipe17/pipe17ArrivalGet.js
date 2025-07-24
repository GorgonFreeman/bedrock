// https://apidoc.pipe17.com/#tag/Arrivals/operation/fetchArrival

const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17ArrivalGet = async (
  {
    arrivalId,
    extArrivalId,
    extArrivalApiId,
    extReferenceId,
  },
  {
    credsPath,
  } = {},
) => {

  const arrivalIdentifier = arrivalId 
  || (extArrivalId ? `ext:${ extArrivalId }` : null) 
  || (extArrivalApiId ? `api:${ extArrivalApiId }` : null) 
  || (extReferenceId ? `ref:${ extReferenceId }` : null);

  const response = await pipe17GetSingle(
    'arrival',
    arrivalIdentifier,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17ArrivalGetApi = async (req, res) => {
  const { 
    arrivalIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'arrivalIdentifier', arrivalIdentifier, p => p.arrivalId || p.extArrivalId || p.extArrivalApiId || p.extReferenceId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17ArrivalGet(
    arrivalIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ArrivalGet,
  pipe17ArrivalGetApi,
};

// curl localhost:8000/pipe17ArrivalGet -H "Content-Type: application/json" -d '{ "arrivalIdentifier": { "extArrivalId": "US-WF-044-B" } }'
// curl localhost:8000/pipe17ArrivalGet -H "Content-Type: application/json" -d '{ "arrivalIdentifier": { "arrivalId": "d22afa93793be1f1" } }'