const xml2json = require('xml2json');

const { respond, mandateParam, credsByPath, customAxios, logDeep } = require('../utils');
const { peoplevoxRequestSetup } = require('../peoplevox/peoplevox.utils');

const peoplevoxAuthGet = async (
  {
    credsPath,
  } = {},
) => {

  const {
    baseUrl,
  } = peoplevoxRequestSetup({ credsPath });
  const url = baseUrl;

  const { 
    CLIENT_ID, 
    USERNAME,
    PASSWORD,
  } = credsByPath(['peoplevox', credsPath]);
  
  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'http://www.peoplevox.net/Authenticate',
  };

  const envelope = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <Authenticate xmlns="http://www.peoplevox.net/">
          <clientId>${ CLIENT_ID }</clientId>
          <username>${ USERNAME }</username>
          <password>${ btoa(PASSWORD) }</password>
        </Authenticate>
      </soap:Body>
    </soap:Envelope>
  `.trim();

  const response = await customAxios(
    url, 
    {
      headers,
      method: 'post',
      body: envelope,
    },
  );

  const parsedResponse = {
    ...response,
    ...response.result ? {
      result: xml2json.toJson(response.result, { object: true }),
    } : {},
  };

  logDeep(parsedResponse);
  return parsedResponse;
};

const peoplevoxAuthGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await peoplevoxAuthGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  peoplevoxAuthGet,
  peoplevoxAuthGetApi,
};

// curl localhost:8000/peoplevoxAuthGet