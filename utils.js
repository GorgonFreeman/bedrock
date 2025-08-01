require('dotenv').config();
const jsYaml = require('js-yaml');
const fs = require('fs').promises;
const readline = require('readline');
const axios = require('axios');
const { EventEmitter } = require('events');

const { env } = process;
const debug = env.DEBUG === 'true';

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

      let errResponseTruncated = errResponse;
      if ((code || status || statusText || config || data)) {
        errResponseTruncated = {
          code,
          status,
          statusText,
          config,
          data,
        };
      }

      verbose && console.warn(errResponseTruncated);
      
      const retryStatuses = [408, 429, ...arrayFromIntRange(500, 599)];
      const retryCodes = ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'];
      const shouldRetry = retryStatuses.includes(status) || retryCodes.includes(code);
      
      if (shouldRetry) {
        if (retryAttempt >= maxRetries) {
          console.log(`Ran out of retries`);
          return {
            success: false,
            error: [errResponseTruncated || error],
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
        error: [errResponseTruncated || error],
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

const arrayStandardResponse = (responses, { flatten = false } = {}) => {
  const results = responses.map(r => r?.result).filter(r => r !== undefined);
  const errors = responses.map(r => r?.error).filter(e => e !== undefined);
  
  return {
    success: responses.every(r => r?.success),
    ...results.length > 0 && { results: flatten ? results.flat() : results },
    ...errors.length > 0 && { errors: flatten ? errors.flat() : errors },
  };
};

const ifTextThenSpace = (text) => {
  try {
    return text ? `${ text } ` : text;
  } catch(err) {
    // console.warn(err);
  }
  return text;
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const transformGraphqlObject = (obj) => {
  if (!obj.edges || !Array.isArray(obj.edges)) {
    return obj;
  }

  const nodes = obj.edges.map(edge => edge.node);
  const { edges, ...otherProps } = obj;

  // If only edges exist, return just the nodes
  if (Object.keys(otherProps).length === 0) {
    return nodes;
  }

  // Otherwise, preserve other properties (like pageInfo) and add items
  return {
    ...otherProps,
    items: nodes
  };
};

const stripEdgesAndNodes = (input) => {
  if (Array.isArray(input)) {
    return input.map(stripEdgesAndNodes);
  }
  
  if (isObject(input)) {
    const transformed = transformGraphqlObject(input);
    
    // Recursively transform all properties
    const result = {};
    for (const [key, value] of Object.entries(transformed)) {
      result[key] = stripEdgesAndNodes(value);
    }
    return result;
  }

  return input;
};

const getterAsGetFunction = (getterFactory) => async (...args) => {
  const options = args[args.length - 1];
  const argsWithoutOptions = args.slice(0, -1);

  const allItems = [];
  
  const getter = await getterFactory(...argsWithoutOptions, {
    ...options,
    onItems: (items) => {
      allItems.push(...items);
    },
  });

  // TODO: Rethink error handling
  let errored = false;
  getter.on('customError', (errorResponse) => {
    console.log('customError', errorResponse);
    errored = errorResponse;
  });

  await getter.run();

  if (errored) {
    return errored;
  }

  return {
    success: true,
    result: allItems,
  };
};

const furthestNode = (obj, ...nodes) => {
  for (const node of nodes) {
    if (strictlyFalsey(obj[node])) {
      return obj;
    }

    obj = obj[node];
  }
  return obj;
};

const objHasAny = (obj, propsArr) => {
  return propsArr.some(prop => !strictlyFalsey(obj[prop]));
};

const objHasAll = (obj, propsArr) => {
  return propsArr.every(prop => !strictlyFalsey(obj[prop]));
};

const objSatisfies = (obj, validators) => {
  return validators.every(validator => validator(obj));
};

const funcApi = (func, { argNames, validatorsByArg } = {}) => {
  return async (req, res) => {

    const { body } = req;

    if (argNames && validatorsByArg) {
      const paramsValid = await Promise.all(
        Object.entries(validatorsByArg).map(([argName, validator]) => {
          return mandateParam(res, argName, body[argName], validator);
        })
      );
      
      if (paramsValid.some(valid => valid === false)) {
        return;
      }
    }

    const response = await func(...argNames.map(argName => body[argName]));
    respond(res, 200, response);
  };
};

const simpleSort = (arr, prop, { reverse } = {}) => {
  return [...arr].sort((a, b) =>
    reverse ? b[prop] - a[prop] : a[prop] - b[prop]
  );
};

const arrayToChunks = (array, chunkSize, { chunkBy } = {}) => {
  if (isNaN(chunkSize) || !(chunkSize > 0)) {
    throw new Error(`arrayToChunks: chunkSize of ${ chunkSize } is invalid`);
  }

  // Simple chunking without grouping
  if (!chunkBy) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Group-aware chunking: ensure items with same chunkBy value stay together
  const sortedArray = simpleSort(array, chunkBy);
  const chunks = [];
  let currentChunk = [];
  let currentGroupValue = null;

  for (const item of sortedArray) {
    const itemGroupValue = item[chunkBy];

    // Start new chunk if:
    // 1. Current chunk is at capacity and next item is from different group
    // 2. Current chunk is empty (first item)
    const shouldStartNewChunk =
      currentChunk.length >= chunkSize && itemGroupValue !== currentGroupValue;

    if (shouldStartNewChunk && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
    }

    currentChunk.push(item);
    currentGroupValue = itemGroupValue;
  }

  // Add the last chunk if it has items
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

class CustomAxiosClient {
  constructor({ baseInterpreter, baseUrl, baseHeaders, factory, bodyTransformer } = {}) {
    this.baseInterpreter = baseInterpreter;
    this.baseUrl = baseUrl;
    this.baseHeaders = baseHeaders;

    // Factory is a function that takes credentials and returns auth like headers and base url
    this.factory = factory;

    // Body transformer is a function that takes the body as provided and modifies it
    // e.g. for SOAP requests
    this.bodyTransformer = bodyTransformer;
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
    context = {}, // TODO: Replace factoryArgs and bodyTransformerArgs with this. Info for any helper functions to pick from.
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
      const factoryOutput = await this.factory(context);

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
    
    if (this.bodyTransformer) {
      body = await this.bodyTransformer(body, context);
    }

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

    let customAxiosPayload = {
      method,
      headers,
      params,
      body,
      verbose,
    };
    context.customAxiosPayload = customAxiosPayload;

    while (!done) {
      try {
        
        response = await customAxios(url, context.customAxiosPayload);

        // logDeep('response', response);
        // await askQuestion('Continue?');
        
        // If customAxios gives a failure, it's nothing to do with user errors or data, it's because something has gone technically wrong. Return it as-is.
        if (!response?.success) {
          verbose && console.log('client response failed');
          return response;
        }

        if (!this.baseInterpreter && !interpreter) {
          verbose && console.log('client response without interpretation');
          return response;
        }

        response = this.baseInterpreter ? await this.baseInterpreter(response, context) : response;
        debug && logDeep('response after baseInterpreter', response);
        debug && await askQuestion('Continue?');
        response = interpreter ? await interpreter(response, context) : response;
        debug && logDeep('response after interpreter', response);
        debug && await askQuestion('Continue?');

        let {
          // success,
          // result,
          // error,
          shouldRetry,
          changedCustomAxiosPayload,
          ...interpretedResponse
        } = response;
        
        if (shouldRetry) {
          if (retryAttempt >= maxRetries) {
            console.warn(`Ran out of retries`);
            return interpretedResponse;
          }

          if (changedCustomAxiosPayload) {
            context.customAxiosPayload = changedCustomAxiosPayload;
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

// https://codepen.io/gorgonfreeman/pen/QwbPNgG?editors=0010
class Getter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    const {
      url, // url is surprisingly optional because the base url may be all you need
      payload, 
      paginator, 
      digester,
      limit,
      onItems,
      onDone,
      logFlavourText,
      client,
      clientArgs,
    } = options;
    
    this.url = url;
    this.payload = payload;
    this.paginator = paginator;
    this.digester = digester;
    this.limit = limit;
    this.logFlavourText = logFlavourText;

    this.client = client;
    this.clientArgs = clientArgs;

    if (onItems) {
      this.on('items', onItems);
    }

    if (onDone) {
      this.on('done', onDone);
    }
  }

  async run({
    verbose = true,
  } = {}) {
    const { paginator, digester } = this;
    
    let resultsCount = 0;
    let done = false;
    let paginatedPayload = this.payload;
    
    while (!done) {
      
      const response = this.client ? await this.client.fetch({
        url: this.url,
        ...paginatedPayload,
        ...(this.clientArgs ?? {}),
      }) : await customAxios(this.url, paginatedPayload);
      
      let items = digester 
      ? await digester(response) 
      : (Array.isArray(response) 
        ? response 
        : [response]
      );

      if (!items) {
        this.emit('customError', response);
        break;
      }
      
      resultsCount = resultsCount + items.length;
      
      // Limit handling - trim the final return if it would result in more items than requested
      if (this.limit && resultsCount >= this.limit) {
        const overlimitAmount = resultsCount - this.limit;
        if (overlimitAmount > 0) {
          items = items.slice(0, -overlimitAmount);
        }
      }
      
      verbose && console.log(`${ ifTextThenSpace(this.logFlavourText) || '' }${ resultsCount } +${ items.length }`);
      this.emit('items', items);
      
      if (!paginator) {
        break;
      }
      
      if (this.limit && resultsCount >= this.limit) {
        break;
      }
      
      [done, paginatedPayload] = await paginator(paginatedPayload, response);
    }

    this.emit('done');
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
  funcApi,
  
  // Misc
  arrayFromIntRange,
  extractCodeBetween,
  readFileYaml,
  writeFileYaml,
  capitaliseString,
  arrayStandardResponse,
  ifTextThenSpace,
  stripEdgesAndNodes,
  getterAsGetFunction,
  strictlyFalsey,
  furthestNode,
  objHasAny,
  objHasAll,
  objSatisfies,
  arrayToChunks,
  
  // Classes
  CustomAxiosClient,
  Operation,
  OperationQueue,
  Getter,
};