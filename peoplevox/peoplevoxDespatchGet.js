const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxDespatchGet = async (
  {
    despatchNumber,
    salesOrderNumber,
  },
  {
    credsPath,
  } = {},
) => {

  let searchClause;
  if (despatchNumber) {
    searchClause = `despatchNumber.Equals("${ despatchNumber }")`;
  } else if (salesOrderNumber) {
    searchClause = `salesOrderNumber.Equals("${ salesOrderNumber }")`;
  }

  const action = 'GetData';

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': `http://www.peoplevox.net/${ action }`,
    },
    method: 'post',
    body: {
      getRequest: {
        TemplateName: 'Despatches',
        SearchClause: `despatchNumber.Equals("${ despatchNumber }")`,
      },
    },
    context: { 
      credsPath,
      action,
     },
    interpreter: peoplevoxStandardInterpreter({ expectOne: true }),
  });
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