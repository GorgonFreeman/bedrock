const { respond, mandateParam, logDeep } = require('../utils');
const { peoplevoxClient, peoplevoxStandardInterpreter } = require('../peoplevox/peoplevox.utils');

const peoplevoxItemsGet = async (
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
        TemplateName: 'Item types',
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

const peoplevoxItemsGetApi = async (req, res) => {
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

  const result = await peoplevoxItemsGet(
    searchClause,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxItemsGet,
  peoplevoxItemsGetApi,
};

// curl localhost:8000/peoplevoxItemsGet -H "Content-Type: application/json" -d '{ "searchClause": "ItemCode.StartsWith(\"EXDAL355-1-\")" }'