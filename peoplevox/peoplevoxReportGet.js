const { respond, mandateParam, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxReportGet = async (
  reportName,
  {
    credsPath,
  } = {},
) => {

  const action = 'GetReportData';

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': `http://www.peoplevox.net/${ action }`,
    },
    method: 'post',
    body: {
      getReportRequest: {
        TemplateName: reportName,
        // ...searchClause ? { SearchClause: searchClause } : {},
        // ...itemsPerPage ? { ItemsPerPage: itemsPerPage } : {},
        // ...filter ? { FilterClause: filter } : {},
        // ...orderBy ? { OrderBy: orderBy } : {},
        // ...columns ? { Columns: columns } : {},
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

const peoplevoxReportGetApi = async (req, res) => {
  const { 
    reportName,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'reportName', reportName),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await peoplevoxReportGet(
    reportName,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxReportGet,
  peoplevoxReportGetApi,
};

// curl localhost:8000/peoplevoxReportGet -H "Content-Type: application/json" -d '{ "reportName": "Item inventory summary" }'