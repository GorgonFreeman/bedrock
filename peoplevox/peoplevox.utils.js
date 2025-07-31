const xml2js = require('xml2js');
const csvtojson = require('csvtojson');
const { credsByPath, CustomAxiosClient, furthestNode, logDeep } = require('../utils');
const { peoplevoxAuthGet } = require('../peoplevox/peoplevoxAuthGet');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');

const SESSION_IDS = new Map();

const getSessionId = async ({ credsPath } = {}) => {

  const { CLIENT_ID } = credsByPath(['peoplevox', credsPath]);
  
  // 1. Check if we have a session ID in memory
  if (SESSION_IDS.has(CLIENT_ID)) {
    console.log('from map');
    return {
      success: true,
      result: SESSION_IDS.get(CLIENT_ID),
    };
  }

  // Check if we have a session ID in Upstash
  const upstashSessionIdResponse = await upstashGet(`pvx_sesh_${ CLIENT_ID }`);

  if (upstashSessionIdResponse?.success && upstashSessionIdResponse?.result) {
    const [clientId, sessionId] = upstashSessionIdResponse.result.split(',');
    SESSION_IDS.set(CLIENT_ID, sessionId);
    console.log('from Upstash');
    return {
      success: true,
      result: sessionId,
    };
  }

  const authResponse = await peoplevoxAuthGet({ credsPath });

  if (!authResponse?.success) {
    return authResponse;
  }

  const sessionId = authResponse?.result;
  SESSION_IDS.set(CLIENT_ID, sessionId);
  await upstashSet(`pvx_sesh_${ CLIENT_ID }`, sessionId);
  
  console.log('from API');
  return { 
    success: true,
    result: sessionId,
  };
};

const peoplevoxBodyTransformer = async ({ action, object }, { credsPath } = {}) => {
  
  const { CLIENT_ID } = credsByPath(['peoplevox', credsPath]);

  let sessionId;
  if (action !== 'Authenticate') {
    // Needs auth
    const sessionIdResponse = await getSessionId({ credsPath });

    if (!sessionIdResponse?.success || !sessionIdResponse?.result) {
      return sessionIdResponse;
    }

    sessionId = sessionIdResponse?.result;
  }
  
  // TODO: Consider if multiple objects can be sent in one request
  const envelopeObject = {
    'soap:Envelope': {
      '$': {
        'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      },
      ...(sessionId) ? {
        'soap:Header': {
          'UserSessionCredentials': {
            '$': {
              'xmlns': 'http://www.peoplevox.net/',
            },
            'UserId': 0,
            'clientId': CLIENT_ID,
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
  console.log('peoplevoxStandardInterpreter');
  // console.log('action', action);
  logDeep('response', response);

  if (!response?.result) {
    return response;
  }

  const excavatedResponse = response.result
    ?.[`${ action }Response`]
    ?.[`${ action }Result`]
  ;

  let {
    ResponseId: responseId,
    Detail: detail,
  } = excavatedResponse || {};

  if (!responseId) {
    return {
      ...response,
      ...response?.result ? {
        result: furthestNode(response.result, `${ action }Response`, `${ action }Result`),
      } : {},
    };
  }

  try {
    detail = await csvtojson().fromString(detail);
  } catch (error) {
    console.log('error parsing Detail', error, Detail);
  }

  if (expectOne) {
    if (detail?.length > 1) {
      return {
        success: false,
        error: [{ 
          message: 'Multiple results found',
          data: detail,
        }],
      };
    }

    detail = detail?.[0]
      ? detail?.[0]
      : null;
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