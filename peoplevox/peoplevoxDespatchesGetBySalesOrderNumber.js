const { respond, mandateParam, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxDespatchesGetBySalesOrderNumber = async (
  salesOrderNumber,
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
        SearchClause: `SalesOrderNumber.Equals("${ salesOrderNumber }")`,
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

const peoplevoxDespatchesGetBySalesOrderNumberApi = async (req, res) => {
  const { 
    salesOrderNumber,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'salesOrderNumber', salesOrderNumber),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await peoplevoxDespatchesGetBySalesOrderNumber(
    salesOrderNumber,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxDespatchesGetBySalesOrderNumber,
  peoplevoxDespatchesGetBySalesOrderNumberApi,
};

// curl localhost:8000/peoplevoxDespatchesGetBySalesOrderNumber -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'