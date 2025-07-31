const { respond, mandateParam, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxReportGet = async (
  reportName,
  {
    credsPath,

    searchClause,
    perPage,
    filter,
    orderBy,
    columns,
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
        ...searchClause ? { SearchClause: searchClause } : {},
        ...perPage ? { ItemsPerPage: perPage } : {},
        ...filter ? { FilterClause: filter } : {},
        ...orderBy ? { OrderBy: orderBy } : {},
        ...columns ? { Columns: columns.join(',') } : {},
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
// curl localhost:8000/peoplevoxReportGet -H "Content-Type: application/json" -d '{ "reportName": "Item inventory summary", "options": { "searchClause": "([Site reference].Equals(\"BaddestSite\"))", "columns": ["Item code", "Available"] } }'