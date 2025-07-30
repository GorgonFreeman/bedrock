const { respond, mandateParam, logDeep } = require('../utils');
const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');

const peoplevoxOrderGet = async (
  salesOrderNumber,
  {
    credsPath,
  } = {},
) => {

  const envelope = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <GetData xmlns="http://www.peoplevox.net/">
          <getRequest>
            <TemplateName>SalesOrder</TemplateName>
            <SearchClause>SalesOrderNumber.Equals(\"${ salesOrderNumber }\")</SearchClause>
          </getRequest>
        </GetData>
      </soap:Body>
    </soap:Envelope>
  `.trim();

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': 'http://www.peoplevox.net/GetData',
    },
    method: 'post',
    body: envelope,
    factoryArgs: [{ credsPath }],
  });
  logDeep(response);
  return response;
  
};

const peoplevoxOrderGetApi = async (req, res) => {
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

  const result = await peoplevoxOrderGet(
    salesOrderNumber,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxOrderGet,
  peoplevoxOrderGetApi,
};

// curl localhost:8000/peoplevoxOrderGet -H "Content-Type: application/json" -d '{ "salesOrderNumber": "5977690603592" }'