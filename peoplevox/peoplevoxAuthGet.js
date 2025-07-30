const xml2js = require('xml2js');
const { respond, mandateParam, credsByPath, customAxios, logDeep, furthestNode } = require('../utils');

const peoplevoxAuthGet = async (
  {
    credsPath,
  } = {},
) => {

  const { 
    CLIENT_ID, 
    USERNAME,
    PASSWORD,
  } = credsByPath(['peoplevox', credsPath]);

  const url = `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`;
  
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
    ...response?.result ? {
      result: await new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        ignoreAttrs: true,
      }).parseStringPromise(response.result),
    } : {},
  };

  const excavatedResponse = parsedResponse.result?.['soap:Envelope']?.['soap:Body']?.AuthenticateResponse?.AuthenticateResult;
  const {
    ResponseId: responseId,
    Detail: detail,
  } = excavatedResponse || {};

  if (!responseId) {
    return {
      ...parsedResponse,
      ...parsedResponse?.result ? {
        result: furthestNode(parsedResponse.result, 'soap:Envelope', 'soap:Body', 'AuthenticateResponse', 'AuthenticateResult'),
      } : {},
    };
  }

  const successful = responseId === '0';
  return {
    success: successful,
    ...successful ? {
      result: detail ? detail : excavatedResponse,
    } : {
      error: [excavatedResponse],
    },
  };
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