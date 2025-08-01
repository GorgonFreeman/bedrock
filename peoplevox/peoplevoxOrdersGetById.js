const { respond, mandateParam, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxOrdersGetById = async (
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

const peoplevoxOrdersGetByIdApi = async (req, res) => {
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

  const result = await peoplevoxOrdersGetById(
    salesOrderNumber,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxOrdersGetById,
  peoplevoxOrdersGetByIdApi,
};

// curl localhost:8000/peoplevoxOrdersGetById -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'