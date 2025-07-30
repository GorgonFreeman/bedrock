const { respond, mandateParam, credsByPath, logDeep } = require('../utils');
const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');

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

  const response = await peoplevoxClient.fetch({
    headers: {
      'SOAPAction': 'http://www.peoplevox.net/Authenticate',
    },
    method: 'post',
    body: envelope,
    factoryArgs: [{ credsPath }],
  });
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