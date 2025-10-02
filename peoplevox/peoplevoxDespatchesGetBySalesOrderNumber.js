const { respond, mandateParam, logDeep, arrayToChunks, arrayStandardResponse } = require('../utils');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const peoplevoxDespatchesGetBySalesOrderNumber = async (
  salesOrderNumbers,
  {
    credsPath,
  } = {},
) => {

  const maxChunkSize = 100;
  const orderIdChunks = arrayToChunks(salesOrderNumbers, maxChunkSize);
  
  const responses = [];
  for (const chunk of orderIdChunks) {
    const searchClause = chunk.map(salesOrderNumber => `([Salesorder number].Equals(\"${ salesOrderNumber }\"))`).join(' OR ');
    const response = await peoplevoxReportGet(
      'Despatch summary',
      {
        searchClause,
        credsPath,
      },
    );
    responses.push(response);
  }

  const response = arrayStandardResponse(responses, { flatten: true });
  // logDeep(response);
  return response;  
};

const peoplevoxDespatchesGetBySalesOrderNumberApi = async (req, res) => {
  const { 
    salesOrderNumbers,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'salesOrderNumbers', salesOrderNumbers),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await peoplevoxDespatchesGetBySalesOrderNumber(
    salesOrderNumbers,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxDespatchesGetBySalesOrderNumber,
  peoplevoxDespatchesGetBySalesOrderNumberApi,
};

// curl localhost:8000/peoplevoxDespatchesGetBySalesOrderNumber -H "Content-Type: application/json" -d '{ "salesOrderNumbers": ["5977690603592"] }'