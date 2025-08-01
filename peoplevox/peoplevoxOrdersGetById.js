const { respond, mandateParam, logDeep, arrayToChunks, arrayStandardResponse } = require('../utils');
const { peoplevoxOrdersGet } = require('../peoplevox/peoplevoxOrdersGet');

const peoplevoxOrdersGetById = async (
  salesOrderNumbers,
  {
    credsPath,
  } = {},
) => {
  
  const maxChunkSize = 100;
  const orderIdChunks = arrayToChunks(salesOrderNumbers, maxChunkSize);
  
  const responses = [];
  for (const chunk of orderIdChunks) {
    const searchClause = chunk.map(salesOrderNumber => `SalesOrderNumber.Equals("${ salesOrderNumber }")`).join(' OR ');
    const response = await peoplevoxOrdersGet(
      searchClause,
      {
        credsPath,
      },
    );
    responses.push(response);
  }

  const response = arrayStandardResponse(responses, { flatten: true });
  logDeep(response);
  return response;
};

const peoplevoxOrdersGetByIdApi = async (req, res) => {
  const { 
    salesOrderNumbers,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'salesOrderNumbers', salesOrderNumbers, Array.isArray),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await peoplevoxOrdersGetById(
    salesOrderNumbers,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxOrdersGetById,
  peoplevoxOrdersGetByIdApi,
};

// curl localhost:8000/peoplevoxOrdersGetById -H "Content-Type: application/json" -d '{ "salesOrderNumbers": ["7040728957000"] }'