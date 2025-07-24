// https://apidoc.pipe17.com/#tag/Arrivals/operation/fetchArrival

const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17ArrivalGet = async (
  /* 
    This "identifier" pattern allows us to have a mandatory arg that can take multiple alternative forms.
    A good example is fetching a customer by id, email, or phone number.
    We pass an object that has at least one of the keys inside.
    The validator for this object checks if it has any of the required keys.
    In the function, we cascade through the keys and use the first one we find,
    ideally with the most specific being at the top (ie. the id).
  */
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
    // This validator allows us to identify an arrival by various means, mandating at least one be provided.
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