const xml2js = require('xml2js');
const csvtojson = require('csvtojson');
const { credsByPath, CustomAxiosClient, furthestNode } = require('../utils');
const { peoplevoxAuthGet } = require('../peoplevox/peoplevoxAuthGet');

const peoplevoxBodyTransformer = async ({ action, object }, { credsPath } = {}) => {
  
  let clientId;
  let sessionId;

  if (action !== 'Authenticate') {
    // Needs auth
    const authResponse = await peoplevoxAuthGet({
      credsPath,
    });

    if (!authResponse?.success) {
      return authResponse;
    }
    
    [clientId, sessionId] = authResponse?.result?.split(',');
  }
  
  // TODO: Consider if multiple objects can be sent in one request
  const envelopeObject = {
    'soap:Envelope': {
      '$': {
        'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      },
      ...(clientId && sessionId) ? {
        'soap:Header': {
          'UserSessionCredentials': {
            '$': {
              'xmlns': 'http://www.peoplevox.net/',
            },
            'UserId': 0,
            'clientId': clientId,
            'SessionId': sessionId,
          }
        }
      } : {},
      'soap:Body': {
        [action]: {
          '$': {
            'xmlns': 'http://www.peoplevox.net/',
          },
          ...object,
        }
      }
    }
  };

  const builder = new xml2js.Builder({
    headless: true,
    renderOpts: {
      pretty: true,
    },
  });

  return builder.buildObject(envelopeObject);
};

const peoplevoxStandardInterpreter = (action, { expectOne } = {}) => async (response) => {
  // console.log('action', action);
  // console.log('response', response);

  let transformedResult;

  if (!response?.result) {
    return response;
  }

  transformedResult = furthestNode(response.result, `${ action }Response`, `${ action }Result`, 'Detail');
  try {
    transformedResult = await csvtojson().fromString(transformedResult);
    if (expectOne) {
      transformedResult = transformedResult?.[0]
        ? transformedResult?.[0]
        : transformedResult?.length > 1
          ? { error: 'Multiple results found' }
          : null;
    }
  } catch (error) {
    console.log('error', error);
  }
  
  return {
    ...response,
    result: transformedResult,
  };
};

const peoplevoxRequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['peoplevox', credsPath]);

  const {
    CLIENT_ID,
  } = creds;
  return {
    baseUrl: `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`,
  };
};

const peoplevoxClient = new CustomAxiosClient({
  baseHeaders: {
    'Content-Type': 'text/xml; charset=utf-8',
  },
  bodyTransformer: peoplevoxBodyTransformer,
  factory: peoplevoxRequestSetup,
  baseInterpreter: async (response) => {
    let parsedResult = null;
    
    if (response.result) {
      parsedResult = await new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        ignoreAttrs: true,
      }).parseStringPromise(response.result);

      parsedResult = furthestNode(parsedResult, 'soap:Envelope', 'soap:Body');
    }
    
    const parsedResponse = {
      ...response,
      ...parsedResult ? {
        result: parsedResult,
      } : {},
    };
    return parsedResponse;
  },
});

module.exports = {
  peoplevoxClient,
  peoplevoxStandardInterpreter,
};