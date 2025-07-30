const { respond, mandateParam, credsByPath, customAxios, logDeep } = require('../utils');

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
  };

  const envelope = `
    <?xml version="1.0" encoding="utf-8"?>                              
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns:xsd="http://www.w3.org/2001/XMLSchema"
      xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <Authenticate xmlns="https://www.peoplevox.net/">
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

  logDeep(response);
  return response;
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