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

const xml2jsParserRaw = new xml2js.Parser({
  explicitArray: false,
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
      console.log('Using session ID from map');
      return {
        success: true,
        result: SESSION_IDS.get(CLIENT_ID),
      };
    }

    // 2. Check if we have a session ID in Upstash
    const upstashSessionIdResponse = await upstashGet(`pvx_sesh_${ CLIENT_ID }`);

    if (upstashSessionIdResponse?.success && upstashSessionIdResponse?.result) {
      const sessionId = upstashSessionIdResponse.result;
      SESSION_IDS.set(CLIENT_ID, sessionId);
      console.log('Using session ID from Upstash');
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

  const [clientId, sessionId] = authResponse?.result?.split(',');
  SESSION_IDS.set(CLIENT_ID, sessionId);
  await upstashSet(`pvx_sesh_${ CLIENT_ID }`, sessionId);
  
  console.log('Using session ID from API');
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
      console.error('Failed to get session ID', sessionIdResponse);
      throw new Error('Failed to get session ID');
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

const peoplevoxStandardInterpreter = ({ expectOne } = {}) => async (response, context) => {
  console.log('peoplevoxStandardInterpreter');
  logDeep('response', response);
  logDeep('context', context);
  await askQuestion('Continue?');

  const { success, result } = response;

  if (!success || !result) {
    return response;
  }

  console.log('result', result);
  await askQuestion('Continue?');
  
  let parsedResult;
  if (expectOne) {
    if (result?.length > 1) {
      return {
        success: false,
        error: [{ 
          message: 'Multiple results found',
          data: result,
        }],
      };
    }

    parsedResult = result?.[0]
      ? result?.[0]
      : null;
  }

  console.log('parsedResult', parsedResult);
  await askQuestion('Continue?');

  return {
    ...response,
    ...(parsedResult ? {
      result: parsedResult,
    } : {}),
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

const peoplevoxBaseInterpreter = async (response, context) => {
  let parsedResult = null;
  const { 
    credsPath,
    customAxiosPayload,
    action,
  } = context;

  if (!response?.result) {
    return response;
  }
    
  parsedResult = await xml2jsParser.parseStringPromise(response.result);
  const excavatedResult = furthestNode(parsedResult, 'soap:Envelope', 'soap:Body', `${ action }Response`, `${ action }Result`);

  let {
    ResponseId: responseId,
    Detail: detail,
  } = excavatedResult;

  if (!responseId) {
    return {
      ...response,
      ...{
        result: excavatedResult,
      },
    };
  }

  const successful = responseId === '0';
  let shouldRetry = false;
  let changedCustomAxiosPayload = null;
  
  // TODO: Consider expectArray as an option
  if (successful) {
    try {
      detail = await csvtojson().fromString(detail);
    } catch (error) {
      console.warn('error parsing Detail', error, Detail);
    }

    // Transform output - only if successful and returning an array
    // if (expectOne) {
    //   if (detail?.length > 1) {
    //     return {
    //       success: false,
    //       error: [{ 
    //         message: 'Multiple results found',
    //         data: detail,
    //       }],
    //     };
    //   }

    //   detail = detail?.[0]
    //     ? detail?.[0]
    //     : null;
    // }
  }
  
  // console.log('detail', detail);

  if (!successful && detail === 'System : Security - Invalid Session') {
    // Auth has expired, fetch a fresh one and edit body to include it
    const { body } = customAxiosPayload;
    const bodyJson = await xml2jsParserRaw.parseStringPromise(body);

    const sessionIdResponse = await getSessionId({ credsPath, forceRefresh: true });
    if (!sessionIdResponse?.success || !sessionIdResponse?.result) {
      console.error('Failed to get session ID', sessionIdResponse, excavatedResult);
      throw new Error('Failed to get session ID');
    }
    
    const sessionId = sessionIdResponse.result;
    bodyJson['soap:Envelope']['soap:Header']['UserSessionCredentials']['SessionId'] = sessionId;
    const changedBodyXml = xml2jsBuilder.buildObject(bodyJson);

    changedCustomAxiosPayload = {
      ...customAxiosPayload,
      body: changedBodyXml,
    };
    shouldRetry = true;
  }

  const interpretedResponse = {

    ...response,

    ...(shouldRetry ? { shouldRetry } : {}),
    ...(changedCustomAxiosPayload ? { changedCustomAxiosPayload } : {}),

    success: successful,
    ...successful ? {
      result: detail ? detail : excavatedResult,
    } : {
      error: [excavatedResult],
    },
  };
  logDeep('interpretedResponse', interpretedResponse);
  return interpretedResponse;
};

const peoplevoxClient = new CustomAxiosClient({
  baseHeaders: {
    'Content-Type': 'text/xml; charset=utf-8',
  },
  bodyTransformer: peoplevoxBodyTransformer,
  factory: peoplevoxRequestSetup,
  baseInterpreter: peoplevoxBaseInterpreter,
});

module.exports = {
  peoplevoxClient,
  peoplevoxStandardInterpreter,
};