const { respond, mandateParam, credsByPath, logDeep } = require('../utils');
const { peoplevoxJsonToXml, peoplevoxClient } = require('../peoplevox/peoplevox.utils');

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

  const envelope = peoplevoxJsonToXml('Authenticate', {
    clientId: CLIENT_ID,
    username: USERNAME,
    password: btoa(PASSWORD),
  });
  
  console.log(envelope);

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