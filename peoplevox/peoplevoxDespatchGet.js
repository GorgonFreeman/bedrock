const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { peoplevoxClient, peoplevoxGetSingle } = require('../peoplevox/peoplevox.utils');

const peoplevoxDespatchGet = async (
  {
    despatchNumber,
    salesOrderNumber,
  },
  {
    credsPath,
  } = {},
) => {

  let response;

  if (despatchNumber) {
    response = await peoplevoxGetSingle(
      'Despatches', 
      { id: despatchNumber, idName: 'despatchNumber' }, 
      { credsPath },
    );
    logDeep(response);
    return response;
  }

  response = await peoplevoxGetSingle(
    'Despatches', 
    { searchClause: `salesOrderNumber.Equals("${ salesOrderNumber }")` }, 
    { credsPath },
  );
  logDeep(response);
  return response;
};

const peoplevoxDespatchGetApi = async (req, res) => {
  const { 
    despatchIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'despatchIdentifier', despatchIdentifier, p => objHasAny(p, ['despatchNumber', 'salesOrderNumber'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await peoplevoxDespatchGet(
    despatchIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxDespatchGet,
  peoplevoxDespatchGetApi,
};

// curl localhost:8000/peoplevoxDespatchGet -H "Content-Type: application/json" -d '{ "despatchIdentifier": { "despatchNumber": "DES9423117" } }'
// curl localhost:8000/peoplevoxDespatchGet -H "Content-Type: application/json" -d '{ "despatchIdentifier": { "salesOrderNumber": "BPR-2181" } }'