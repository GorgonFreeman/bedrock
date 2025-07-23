require('dotenv').config();
const jsYaml = require('js-yaml');
const fs = require('fs').promises;
const readline = require('readline');
const axios = require('axios');

const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

const respond = (res, status, data, { contentType = 'application/json' } = {}) => {
  return res.writeHead(status, { 'Content-Type': contentType }).end(contentType === 'application/json' ? JSON.stringify(data) : data);
};

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
};

// equivalent to customAxiosV3 in pebl
const customAxios = async (url, {
  method = 'get',
  headers,
  params,
  body,
  
  verbose,
} = {}) => {
  
  const axiosConfig = {
    ...(headers && { headers }),
    ...(params && { params }),
  };
  
  let response;
  let done = false;
  let cooldown = 3000;
  let retryAttempt = 0;
  let maxRetries = 5;
  
  while (!done) {
    try {
      
      response = method === 'get' 
      ? await axios[method](url, axiosConfig)
      : await axios[method](url, body, axiosConfig);
      
      return {
        success: true,
        result: response.data,
      };
      
    } catch(error) {
      
      const { response: errResponse } = error;
      const { code, status, statusText, config, headers = {}, data } = errResponse || {};
      
      verbose && console.error(status, code);

      const shortErrResponse = {
        code,
        status,
        statusText,
        config,
        data,
      };

      verbose && console.warn(shortErrResponse);
      
      const retryStatuses = [408, 429, ...arrayFromIntRange(500, 599)];
      const retryCodes = ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'];
      const shouldRetry = retryStatuses.includes(status) || retryCodes.includes(code);
      
      if (shouldRetry) {
        if (retryAttempt >= maxRetries) {
          console.log(`Ran out of retries`);
          return {
            success: false,
            error: [shortErrResponse || errResponse || error],
          };
        }
        
        retryAttempt++;
        const waitTime = headers?.['retry-after'] ? (headers['retry-after'] * 1000) : cooldown;
        verbose && console.log(`Retry attempt #${ retryAttempt }, waiting ${ waitTime }`);
        await wait(waitTime);
        cooldown += cooldown;
        continue;
      }
      
      return {
        success: false,
        error: [shortErrResponse || errResponse || error],
      };
      
    }
  }
};

const arrayFromIntRange = (start, end, { step = 1 } = {}) => {
  return [...Array(end - start + 1).keys()].map(i => (i * step) + start);
};

const logDeep = (...args) => {
  for (const arg of args) {
    console.dir(arg, { depth: null });
  }
};

const extractCodeBetween = (text, start, end, options) => {
  const { excludeEnds } = options;

  const textContainsStart = text.includes(start);
  const textContainsEnd = text.includes(end);
  if (!(textContainsStart && textContainsEnd)) {
    return null;
  }

  let extractedText = text;

  const textSplitByStart = extractedText.split(start);
  textSplitByStart.shift();
  extractedText = textSplitByStart.join(start);

  const textSplitByEnd = extractedText.split(end);
  const partBeforeEnd = textSplitByEnd.shift();
  extractedText = [
    excludeEnds ? null : start, 
    partBeforeEnd, 
    excludeEnds ? null : end,
  ].join('');

  return extractedText;
};

const readFileYaml = async filePath => {
  const fileContents = await fs.readFile(filePath, 'utf8');
  return jsYaml.load(fileContents);
};

const writeFileYaml = async (filePath, json) => {
  const yamlData = jsYaml.dump(json);
  return await fs.writeFile(filePath, yamlData);
};

const capitaliseString = (string) => `${ string[0].toUpperCase() }${ string.slice(1) }`;

const credsByPath = (path) => {

  // First, break the path into nodes by '.'
  // It can take a string, e.g. 'platform.key.subKey'
  // or an array, e.g. ['platform', 'key', 'subKey']
  // or a mix of both, e.g. ['platform', 'key.subKey']
  // This is to allow ultimate flexibility when calling the function.

  let nodes = Array.isArray(path) 
  ? path.map(node => {
    try {
      return node.split('.');
    } catch (err) {
      return null;
    }
  }) 
  : path.split('.');
  nodes = nodes.flat().filter(n => n);

  // We conventionally call the first node the platform and the second the key, but it's up to you.
  // In the actual platform functions, use a variable that makes sense.
  // This could be region, or account, or shop, or whatever.

  const { env } = process;
  let { CREDS } = env;

  try {
    CREDS = JSON.parse(CREDS);
  } catch (err) {
    throw new Error(`Malformed CREDS environment variable: ${ err }`);
  }

  // console.log('CREDS', CREDS);

  let creds = CREDS;
  for (const node of nodes) {
    const nodeCreds = creds?.[node];

    if (!nodeCreds) {
      console.error(`No creds found at ${ path }, failed at ${ node } - falling back.`);
      break;
    }

    creds = {
      ...creds,
      ...nodeCreds,
    };
  }

  // console.log('creds', creds);

  // Keep only uppercase attributes
  for (const k of Object.keys(creds)) {
    if (k !== k.toUpperCase()) {
      delete creds[k];
    }
  }

  // console.log('creds', creds);
  
  // Turn certain props found as arrays into a single random value
  // const arrayToSingleValueProps = [
  // ];
  // for (const [k, v] of Object.entries(creds)) {
  //   if (Array.isArray(v) && arrayToSingleValueProps.includes(k)) {
  //     creds[k] = v[randomNumber(0, v.length - 1)];
  //   }
  // }

  return creds;
};

const strictlyFalsey = (value) => {

  if (value) {
    return false;
  }

  const looselyFalseyValues = [0, false, ''];
  if (looselyFalseyValues.includes(value)) {
    return false;
  }

  return true;
};

// TO DO: Handle response in xApi function and provide all errors, instead of responding here
const mandateParam = async (
  res, 
  paramName, 
  paramValue, 
  {
    validator,
  } = {},
) => {

  const valid = validator ? await validator(paramValue) : !strictlyFalsey(paramValue);

  if (valid) {
    return true;
  }

  console.error(`Param '${ paramName }' not ${ validator ? 'valid' : 'provided' }`);
  respond(res, 400, { error: `Please provide a ${ validator ? 'valid ' : '' }value for '${ paramName }'` });
  return false;
};

const arrayStandardResponse = (responses) => {
  return {
    success: responses.every(r => r?.success),
    results: responses.map(r => r?.result),
    errors: responses.map(r => r?.error),
  };
};

class CustomAxiosClient {
  constructor({ baseInterpreter, baseUrl, baseHeaders, factory } = {}) {
    this.baseInterpreter = baseInterpreter;
    this.baseUrl = baseUrl;
    this.baseHeaders = baseHeaders;

    // Factory is a function that takes credentials and returns auth like headers and base url
    this.factory = factory;
  }

  async fetch({
    url, // url is surprisingly optional because the base url may be all you need

    // customAxios payload
    method,
    headers,
    params,
    body,
    
    verbose,
    interpreter,
    ...factoryArgs // Arguments for deriving auth
  } = {}) {

    console.log('fetch: before factory', {
      url,
      method,
      headers,
      params,
      body,
    });

    let baseUrl = this.baseUrl;
    let baseHeaders = this.baseHeaders;
    
    if (this.factory) {
      const factoryOutput = this.factory(factoryArgs);

      if (factoryOutput.baseUrl) {
        baseUrl = factoryOutput.baseUrl;
      }

      if (factoryOutput.headers) {
        baseHeaders = {
          ...(baseHeaders ?? {}),
          ...(factoryOutput.headers ?? {}),
        };
      }
    }

    if (!url) {
      url = baseUrl;
    } else if (baseUrl) {
      // Remove trailing and leading slashes
      baseUrl = baseUrl.replace(/\/$/, '');
      url = url.replace(/^\//, '');
      url = `${ baseUrl }/${ url }`;
    }

    headers = {
      ...(baseHeaders ?? {}),
      ...(headers ?? {}),
    };

    console.log('fetch: after factory', {
      url,
      method,
      headers,
      params,
      body,
    });
    
    let response;
    let done = false;
    let cooldown = 3000;
    let retryAttempt = 0;
    let maxRetries = 5;

    while (!done) {
      try {
        
        response = await customAxios(url, {
          method,
          headers,
          params,
          body,
          verbose,
        });
        
        // If customAxios gives a failure, it's nothing to do with user errors or data, it's because something has gone technically wrong. Return it as-is.
        if (!response?.success) {
          verbose && console.log('client response failed');
          return response;
        }

        if (!this.baseInterpreter && !interpreter) {
          verbose && console.log('client response without interpretation');
          return response;
        }

        response = this.baseInterpreter ? await this.baseInterpreter(response) : response;
        response = interpreter ? await interpreter(response) : response;

        let {
          // success,
          // result,
          // error,
          shouldRetry,
          ...interpretedResponse
        } = response;
        
        if (shouldRetry) {
          if (retryAttempt >= maxRetries) {
            console.warn(`Ran out of retries`);
            return interpretedResponse;
          }

          retryAttempt++;
          const waitTime = cooldown;
          verbose && console.log(`Retry attempt #${ retryAttempt }, waiting ${ waitTime }`);
          await wait(waitTime);
          cooldown += cooldown;
          continue;
        }

        if (!interpretedResponse || typeof interpretedResponse !== 'object') {
          verbose && console.warn('client response interpreter failed');
          return {
            success: false,
            error: ['Response interpreter failed'],
          };
        }
        
        verbose && console.log('client response successful and interpreted');
        return interpretedResponse;

      } catch(error) { 

        verbose && console.warn('client response failed');
        return {
          success: false,
          error,
        } 
      }
    }
  }
}

class Operation {
  constructor(func, { args = [], options = {} } = {}) {
    this.func = func;
    this.args = args;
    this.options = options;
  }

  async run() {
    return this.func(...this.args, this.options);
  }
}

class OperationQueue {
  constructor(operations) {
    
    if (operations && operations.some(op => !(op instanceof Operation))) {
      throw new Error('OperationQueue only takes Operations');
    }

    this.queue = operations || [];
  }

  add(operation) {
    if (!(operation instanceof Operation)) {
      throw new Error('OperationQueue only takes Operations');
    }

    this.queue.push(operation);
  }

  async run({ 
    interval = false,
    verbose = true,
  } = {}) {

    // Run at interval
    if (interval) {
      const results = new Array(this.queue.length);
      let completedCount = 0;
      
      // For each operation, run it without awaiting, and await the interval
      for (const [i, op] of this.queue.entries()) {
        (async () => {
          const result = await op.run();
          // Preserve result order
          results[i] = result;
          completedCount++;
          
          if (verbose) {
            console.log(`${ completedCount } / ${ this.queue.length }`);
          }
        })();

        await wait(interval);
      }
      
      // Wait for all operations to complete
      while (completedCount < this.queue.length) {
        await wait(seconds(1));
      }
      
      this.queue.length = 0;
      return results;
    }

    // Run in sequence
    const results = [];
    for (const op of this.queue) {
      const result = await op.run();
      results.push(result);
      if (verbose) {
        console.log(`${ results.length } / ${ this.queue.length }`);  
      }
    }

    this.queue.length = 0;
    return results;
  }
}

module.exports = {

  // Really core
  wait,
  respond,
  askQuestion,
  credsByPath,
  logDeep,
  mandateParam,
  customAxios,
  
  // Misc
  arrayFromIntRange,
  extractCodeBetween,
  readFileYaml,
  writeFileYaml,
  capitaliseString,
  arrayStandardResponse,

  // Classes
  CustomAxiosClient,
  Operation,
  OperationQueue,
};