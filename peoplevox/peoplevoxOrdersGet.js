const { respond, mandateParam, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxOrdersGet = async (
  searchClause,
  {
    credsPath,
  } = {},
) => {

  const action = 'GetData';

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': `http://www.peoplevox.net/${ action }`,
    },
    method: 'post',
    body: {
      getRequest: {
        TemplateName: 'Sales orders',
        SearchClause: searchClause,
      },
    },
    context: { 
      credsPath,
      action,
     },
    interpreter: peoplevoxStandardInterpreter(),
  });
  logDeep(response);
  return response;
  
};

const peoplevoxOrdersGetApi = async (req, res) => {
  const { 
    searchClause,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'searchClause', searchClause),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await peoplevoxOrdersGet(
    searchClause,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxOrdersGet,
  peoplevoxOrdersGetApi,
};

// curl localhost:8000/peoplevoxOrdersGet -H "Content-Type: application/json" -d '{ "searchClause": "SalesOrderNumber.Equals(\"5977690603592\")" }'
// curl localhost:8000/peoplevoxOrdersGet -H "Content-Type: application/json" -d '{ "searchClause": "CustomerPurchaseOrderReferenceNumber.StartsWith(\"#547\")" }'
// curl localhost:8000/peoplevoxOrdersGet -H "Content-Type: application/json" -d '{ "searchClause": "ServiceType.Equals(\"3J35\") AND Status.Equals(5)" }'