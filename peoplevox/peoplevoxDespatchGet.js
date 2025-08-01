const { respond, mandateParam, logDeep, objHasAny, askQuestion, surveyObjects } = require('../utils');
const { peoplevoxGetSingle } = require('../peoplevox/peoplevox.utils');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

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
  
  const reportResponse = await peoplevoxReportGet(
    'Despatch summary',
    {
      credsPath,
      searchClause: `([Salesorder number].Equals(\"${ salesOrderNumber }\"))`,
      perPage: 50,
    },
  );

  if (!reportResponse?.success || !reportResponse?.result?.length) {
    return reportResponse;
  }
  
  const trackingNumbers = Array.from(new Set(reportResponse.result.map(r => r['Tracking number'])));
  console.log(trackingNumbers);

  if (trackingNumbers?.length > 1) {
    return { 
      success: false,
      error: [{
        message: 'Multiple tracking numbers found for this sales order',
        data: trackingNumbers,
      }],
    };
  }

  const trackingNumber = trackingNumbers?.[0];

  if (!trackingNumber) {
    return { 
      success: false,
      error: [{
        message: 'No tracking number found for this sales order',
        data: salesOrderNumber,
      }],
    };
  }
  await askQuestion('?');


  // response = await peoplevoxGetSingle(
  //   'Despatches', 
  //   { searchClause: `salesOrderNumber.Equals("${ salesOrderNumber }")` }, 
  //   { credsPath },
  // );
  // logDeep(response);
  // return response;

  return;
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
// curl localhost:8000/peoplevoxDespatchGet -H "Content-Type: application/json" -d '{ "despatchIdentifier": { "salesOrderNumber": "  PRFB-1634 " } }'