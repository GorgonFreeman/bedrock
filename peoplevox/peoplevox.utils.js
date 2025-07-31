const xml2js = require('xml2js');
const csvtojson = require('csvtojson');
const { credsByPath, CustomAxiosClient, furthestNode, logDeep, askQuestion } = require('../utils');
const { peoplevoxAuthGet } = require('../peoplevox/peoplevoxAuthGet');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');

const SESSION_IDS = new Map();

const xml2jsParser = new xml2js.Parser({
  explicitArray: false,
  mergeAttrs: true,
  ignoreAttrs: true,
});
const xml2jsBuilder = new xml2js.Builder({
  headless: true,
  renderOpts: {
    pretty: true,
  },
});

const getSessionId = async ({ credsPath, forceRefresh } = {}) => {

  const { CLIENT_ID } = credsByPath(['peoplevox', credsPath]);
  
  if (!forceRefresh) {
    // 1. Check if we have a session ID in memory
    if (SESSION_IDS.has(CLIENT_ID)) {
      console.log('from map');
      return {
        success: true,
        result: SESSION_IDS.get(CLIENT_ID),
      };
    }

    // 2. Check if we have a session ID in Upstash
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
  }
  
  // 3. Get a session ID from the API
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

  return xml2jsBuilder.buildObject(envelopeObject);
};

const peoplevoxStandardInterpreter = (action, { expectOne } = {}) => async (response, context) => {
  console.log('peoplevoxStandardInterpreter');
  // console.log('action', action);
  logDeep('response', response);
  logDeep('context', context);

  if (!response?.result) {
    return response;
  }

  const excavatedResponse = response.result
    ?.[`${ action }Response`]
    ?.[`${ action }Result`]
  ;
  console.log('excavatedResponse', excavatedResponse);

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

  const successful = responseId === '0';
  let shouldRetry = false;
  let changedCustomAxiosPayload = null;

  if (successful) {
    try {
      detail = await csvtojson().fromString(detail);
    } catch (error) {
      console.log('error parsing Detail', error, Detail);
    }

    // Transform output - only if successful and returning an array
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
  }
  
  console.log('detail', detail);
  if (!successful && detail === 'System : Security - Invalid Session') {
    // Auth has expired, fetch a fresh one
    // TODO: Fix issue where auth is refreshed, but the new auth is not used in the next request
    const { credsPath, customAxiosPayload } = context;

    console.log('customAxiosPayload', customAxiosPayload);
    await askQuestion('?');

    const { body } = customAxiosPayload;
    const bodyJson = await xml2jsParser.parseStringPromise(body);

    console.log('bodyJson', bodyJson);
    await askQuestion('?');

    const sessionIdResponse = await getSessionId({ credsPath, forceRefresh: true });
    if (!sessionIdResponse?.success || !sessionIdResponse?.result) {
      return {
        success: false,
        error: [excavatedResponse, sessionIdResponse],
      };
    }

    shouldRetry = true;
  }

  const interpretedResponse = {
    shouldRetry,
    changedCustomAxiosPayload,
    success: successful,
    ...successful ? {
      result: detail ? detail : excavatedResponse,
    } : {
      error: [excavatedResponse],
    },
  };
  logDeep('interpretedResponse', interpretedResponse);
  return interpretedResponse;  
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
      parsedResult = await xml2jsParser.parseStringPromise(response.result);

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