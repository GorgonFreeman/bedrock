const xml2js = require('xml2js');
const { credsByPath, CustomAxiosClient } = require('../utils');

const peoplevoxJsonToXml = (action, object) => {
  
  // TODO: Consider if multiple objects can be sent in one request
  const envelopeObject = {
    'soap:Envelope': {
      '$': {
        'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      },
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
  // bodyTransformer: (body) => {

  // },
  factory: peoplevoxRequestSetup,
  baseInterpreter: async (response) => {
    let parsedResult = null;
    
    if (response.result) {
      parsedResult = await new Promise((resolve, reject) => {
        xml2js.parseString(response.result, {
          explicitArray: false,
          mergeAttrs: true,
          ignoreAttrs: true,
        }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
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
  peoplevoxJsonToXml,
  peoplevoxClient,
};