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
  omitRequestId = false,
} = {}) => {
  
  // Generate a request ID if not provided
  if (!omitRequestId) {
    if (!headers) {
      headers = {};
    }

    if (!headers['x-request-id']) {
      headers['x-request-id'] = Date.now();
    }
  }
  
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
      
      // TODO: Consider hooking back up to verbose / local/hosted
      console.warn(errResponseTruncated);
      
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
  let results = responses.map(r => r?.result).filter(r => r !== undefined);
  let errors = responses.map(r => r?.error).filter(e => e !== undefined);

  if (flatten) {
    results = results.flat();
    errors = errors.flat();
  }

  return {
    success: responses.every(r => r?.success),
    ...!strictlyFalsey(results?.length) && { result: flatten ? results.flat() : results },
    ...!strictlyFalsey(results?.length) && { resultsCount: results.length },
    ...!strictlyFalsey(errors?.length) && { errors: flatten ? errors.flat() : errors }, 
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

  constructor({ 
    baseInterpreter, 
    baseUrl, 
    baseHeaders, 
    context,
    requiredContext,
    preparer,
  } = {}) {

    this.baseInterpreter = baseInterpreter;
    this.baseUrl = baseUrl;
    this.baseHeaders = baseHeaders;
    
    // Allow setting context on construction in case it's good for the life of the client
    this.context = context;
    // requiredContext is an array of props that must be present in context in order to make calls - usually credsPath
    // If we need to support authless calls in the future, we can change it to a validator function, and that function can check needsAuth vs the presence of credsPath
    this.requiredContext = requiredContext;
    // Preparer is a function that takes context, and updates stuff like auth
    this.preparer = preparer;
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
    
    /* Things to expect in context:
      - credsPath
      - needsAuth
      - apiVersion
      - anything the preparer wants to use, case by case
    */
    context = {},
    
  } = {}) {

    let { baseUrl, baseHeaders } = this;

    debug && logDeep('fetch', {
      baseUrl,
      baseHeaders,
      url,
      method, 
      headers, 
      params, 
      body,
      verbose,
      interpreter,
      context,
    });
    debug && await askQuestion('?');

    let fetchContext = {
      ...context,
      ...(method ? { method } : {}),
      ...(headers ? { headers } : {}),
      ...(params ? { params } : {}),
      ...(body ? { body } : {}),
    };

    if (this.requiredContext) {
      for (const contextProp of this.requiredContext) {
        if (strictlyFalsey(fetchContext[contextProp])) {
          throw new Error(`Missing context: ${ contextProp }`);
        }
      }
    }
    
    if (this.preparer) {
      const {
        baseUrl: preparedBaseUrl,
        headers: preparedHeaders,
        params: preparedParams,
        body: preparedBody,
      } = await this.preparer(fetchContext);

      if (preparedBaseUrl) {
        baseUrl = preparedBaseUrl;
      }

      if (preparedHeaders) {
        headers = {
          ...(headers ?? {}),
          ...(preparedHeaders ?? {}),
        };
      }

      if (preparedParams) {
        params = {
          ...(params ?? {}),
          ...(preparedParams ?? {}),
        };
      }

      if (preparedBody) {
        body = preparedBody;
      }

      debug && logDeep('after preparer', {
        baseUrl: this.baseUrl,
        headers,
        params,
        body,
      });
      debug && await askQuestion('?');
    }

    // Supplement url with baseUrl
    if (!url) {
      url = baseUrl;
    } else if (baseUrl) {
      // Remove baseUrl from url if it's there
      if (url.startsWith(baseUrl)) {
        url = url.slice(baseUrl.length);
      }
      // Remove trailing and leading slashes
      baseUrl = baseUrl.replace(/\/$/, '');
      url = url.replace(/^\//, '');
      // Construct final url from baseUrl + url
      url = `${ baseUrl }/${ url }`;
    }
    
    // Supplement headers with baseHeaders
    headers = {
      ...(baseHeaders ?? {}),
      ...(headers ?? {}),
    };
    
    let response;
    let done = false;
    let cooldown = 3000;
    let retryAttempt = 0;
    let maxRetries = 5;

    while (!done) {
      try {

        const customAxiosPayload = {
          method,
          headers,
          params,
          body,
          verbose,
        };
        // This is to pass through to interpreters so they have a source of truth for what was sent.
        // They return stuff directly and since it's within the while loop, it doesn't get transformed again.
        // So I think we're ok to mutate the fetchContext like this.
        fetchContext = {
          ...fetchContext,
          ...customAxiosPayload, 
        };

        debug && logDeep('customAxiosPayload', customAxiosPayload);
        debug && await askQuestion('?');
        
        response = await customAxios(url, customAxiosPayload);

        debug && logDeep('response', response);
        debug && await askQuestion('Continue?');
        
        // If customAxios gives a failure, it's nothing to do with user errors or data, it's because something has gone technically wrong. Return it as-is.
        // Actually, we need to pass these through for failed auth for example.
        if (!response?.success) {
          if (!response?.error || response?.error?.some(err => ![401].includes(err?.status))) {
            verbose && console.log('client response failed');
            return response;
          }
        }

        if (!this.baseInterpreter && !interpreter) {
          verbose && console.log('client response without interpretation');
          return response;
        }

        response = this.baseInterpreter ? await this.baseInterpreter(response, fetchContext) : response;
        debug && logDeep('response after baseInterpreter', response);
        debug && await askQuestion('?');
        response = interpreter ? await interpreter(response, fetchContext) : response;
        debug && logDeep('response after interpreter', response);
        debug && await askQuestion('?');

        let {
          // success,
          // result,
          // error,
          shouldRetry,
          retryWithPayload,
          ...interpretedResponse
        } = response;
        
        if (shouldRetry) {
          if (retryAttempt >= maxRetries) {
            console.warn(`Ran out of retries`);
            return interpretedResponse;
          }

          if (retryWithPayload) {
            // TODO: Consider just spreading the whole thing, and expecting the interpreter to retain headers and params.
            const {
              method: retryMethod,
              headers: retryHeaders,
              params: retryParams,
              body: retryBody,
            } = retryWithPayload;

            if (retryMethod) {
              method = retryMethod;
            }

            if (retryHeaders) {
              headers = {
                ...(headers ?? {}),
                ...(retryHeaders ?? {}),
              };
            }

            if (retryParams) {
              params = {
                ...(params ?? {}),
                ...(retryParams ?? {}),
              };
            }

            if (retryBody) {
              body = retryBody;
            }
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

  // TODO: Interval mode for predictable pagination schemes
  async run({
    verbose = true,
  } = {}) {
    const { paginator, digester } = this;
    
    let resultsCount = 0;
    let done = false;
    let paginatedPayload = this.payload;
    let url = this.url;
    
    while (!done) {
      
      const response = this.client ? await this.client.fetch({
        url,
        ...paginatedPayload,
        ...(this.clientArgs ?? {}),
      }) : await customAxios(url, paginatedPayload);
      
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
      
      /* Pagination logic */
      const additionalPaginationData = {
        url,
        resultsCount,
        lastPageResultsCount: items.length,
      };
      
      let paginatedMisc;
      [done, paginatedPayload, paginatedMisc] = await paginator(paginatedPayload, response, additionalPaginationData);

      const {
        url: paginatedUrl,
      } = paginatedMisc || {};

      if (paginatedUrl) {
        url = paginatedUrl;
      }
      /* /Pagination logic */
    }

    this.emit('done');
  }
}

const gidToId = (gid) => gid?.split('/')?.pop();

const surveyObjects = (objArr) => {
  if (!Array.isArray(objArr) || objArr.length === 0) {
    throw new Error('surveyObjects requires an array of objects');
  }

  const survey = {};

  for (const obj of objArr) {
    if (!obj || typeof obj !== 'object') {
      continue;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (!survey[key]) {
        survey[key] = new Set();
      }
      survey[key].add(value);
    }
  }

  // Convert Sets to arrays for easier consumption
  const result = {};
  for (const [key, valueSet] of Object.entries(survey)) {
    result[key] = Array.from(valueSet);
  }

  return result;
};

const seconds = number => number * 1000;
const minutes = number => number * 1000 * 60;
const hours = number => number * 1000 * 60 * 60;
const days = number => number * 1000 * 60 * 60 * 24;
const weeks = number => number * 1000 * 60 * 60 * 24 * 7;
const monthsish = number => number * 1000 * 60 * 60 * 24 * 30;
const yearsish = number => number * 1000 * 60 * 60 * 24 * 365;

const readableTimeFromMs = (ms) => {

  let readableMs = ms;

  let readableSeconds = Math.floor(readableMs / 1000);
  readableMs -= seconds(readableSeconds);

  let readableMinutes = Math.floor(readableSeconds / 60);
  readableSeconds -= minutes(readableMinutes);

  let readableHours = Math.floor(readableMinutes / 60);
  readableMinutes -= hours(readableHours);

  let readableDays = Math.floor(readableHours / 24);
  readableHours -= days(readableDays);

  return `${ readableDays }d ${ readableHours }h ${ readableMinutes }m ${ readableSeconds }s ${ readableMs }ms`;
};

const dateTimeFromNow = ({ plus, minus, startDate, dateOnly } = {}) => {
  let adjustedDate = startDate ? new Date(startDate) : new Date();

  if (plus) {
    adjustedDate = new Date(adjustedDate.getTime() + plus);
  }

  if (minus) {
    adjustedDate = new Date(adjustedDate.getTime() - minus);
  }

  const adjustedDateIso = adjustedDate.toISOString();

  if (dateOnly) {
    return adjustedDateIso.slice(0, 10);
  }

  return adjustedDateIso;
};

// https://codepen.io/gorgonfreeman/pen/bNdJQRo
class Processor extends EventEmitter {
  constructor(pile, action, pileExhaustedCheck, options = {}) {
    super();
    
    this.pile = pile;
    this.action = action;
    this.pileExhaustedCheck = pileExhaustedCheck;
    
    let { 
      canFinish = true,
      pileSizeCheck,
      logFlavourText,
      onDone,
      maxInFlightRequests = 10,
      runOptions = {},
    } = options;
    
    this.canFinish = canFinish;
    this.pileSizeCheck = pileSizeCheck;
    this.logFlavourText = logFlavourText;
    this.maxInFlightRequests = maxInFlightRequests;
    this.runOptions = runOptions;
    
    if (onDone) { 
      this.on('done', onDone);
    }
  }
  
  getPileSize() {
    
    const { pile, pileSizeCheck } = this;
    
    if (pileSizeCheck) {
      return pileSizeCheck(pile);
    }
    
    if (Array.isArray(pile)) {
      return pile.length;
    }
    
    // No known way to check the size of the pile
  }

  getPileExhausted() {
    const { pile, pileExhaustedCheck } = this;
    return pileExhaustedCheck(pile);
  }
  
  async run({
    interval = false,
    verbose = true,
  } = this.runOptions) {
    
    let finished = false;
    let results = [];
    
    let startedCount = 0;
    let completedCount = 0;

    const initialSize = this.getPileSize();

    const executeAction = async () => {
      const actionResult = await this.action(this.pile);
      results.push(actionResult);
      completedCount++;
      
      const pileSize = this.getPileSize();
      verbose && console.log(`${ ifTextThenSpace(this.logFlavourText) || '' }${ completedCount }/${ typeof initialSize === 'number' && initialSize > 0 ? `${ initialSize } > ` : '' }${ typeof pileSize === 'number' ? `${ pileSize }` : '?' }`);
    };
    
    while (!finished) {
      
      const pileExhausted = this.getPileExhausted();
      
      if (pileExhausted) {
        
        // If interval, wait for all results to be in
        if (this.canFinish &&interval && (startedCount !== completedCount)) {
          verbose && console.log(`${ ifTextThenSpace(this.logFlavourText) || '' }waiting for all operations to complete`);
          await wait(1000);
          continue;
        }

        if (this.canFinish) {
          finished = true;
          break;
        }
        
        verbose && console.log(`${ ifTextThenSpace(this.logFlavourText) || '' }waiting for permission to finish`);
        await wait(1000);
        continue;
      }

      const requestsInFlight = startedCount - completedCount;
      // console.log('requestsInFlight', requestsInFlight);
      if (requestsInFlight >= this.maxInFlightRequests) {
        verbose && console.log(`${ ifTextThenSpace(this.logFlavourText) || '' }hitting max in flight requests, waiting for some to complete`);
        await wait(3000);
        continue;
      }
      
      startedCount++;
      
      if (interval) {
        (async () => {
          await executeAction();
        })();
        
        await wait(interval);
        continue;
      }
      
      await executeAction();
    }
    
    verbose && console.log(`${ ifTextThenSpace(this.logFlavourText) || '' }finished`);
    this.emit('done');
    return results;
  }
}

class ProcessorPipeline {

  /* processorBlueprint:
    {
      maker: function,
      piles,
      makerArgs,
      makerOptions,
    }
  */

  constructor(processorBlueprints = []) {
    this.processorBlueprints = processorBlueprints;
  }

  add(processorBlueprint) {
    this.processorBlueprints.push(processorBlueprint);
  }

  length() {
    return this.processorBlueprints.length;
  }

  async run(inputPile) {

    const pipeline = [];

    let pileIn = inputPile;
    let pileOut = [];

    for (const [i, processorBlueprint] of this.processorBlueprints.entries()) {
      
      const firstStep = i === 0;
      const lastStep = i === this.processorBlueprints.length - 1;

      const { maker, piles = {}, makerArgs = [], makerOptions } = processorBlueprint;
      const processor = maker(
        {
          in: pileIn,
          continue: pileOut,
          ...piles,
        }, 
        ...makerArgs, 
        {
          canFinish: firstStep ? true : false,
          logFlavourText: `${ pipeline.length + 1 }:`,
          ...makerOptions,
        },
      );
      pipeline.push(processor);
      
      if (!lastStep) {
        // Advance piles
        pileIn = pileOut;
        pileOut = [];
      }
    }

    for (const [i, processor] of pipeline.entries()) {
      const nextProcessor = pipeline[i + 1];
      if (nextProcessor) {
        processor.on('done', () => nextProcessor.canFinish = true);
      }
    }

    await Promise.all(pipeline.map(processor => processor.run()));

    // Return the final piles or results
    console.log('pipeline run dynamic piles', pileIn, pileOut);
    return {
      pileIn,
      pileOut,
    };
  }
};

const actionMultipleOrSingle = async (input, func, buildOpArgs) => {
  if (Array.isArray(input)) {
    const queue = new OperationQueue(input.map(inputItem => new Operation(
      func, 
      buildOpArgs(inputItem),
    )));
    let queueResponses = await queue.run();
    queueResponse = arrayStandardResponse(queueResponses);
    return queueResponse;
  }

  return new Operation(func, buildOpArgs(input)).run();
};

const standardInterpreters = {
  expectOne: (response) => {
    if (!response?.success) {
      return response;
    }

    result = response?.result;

    if (!result) {
      throw new Error('Nothing given, nothing gotten');
    }

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

    return {
      ...response,
      ...(parsedResult ? {
        result: parsedResult,
      } : {}),
    };
  },
};

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

  // Time
  seconds,
  minutes,
  hours,
  days,
  weeks,
  monthsish,
  yearsish,
  dateTimeFromNow,
  readableTimeFromMs,
  
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
  gidToId,
  surveyObjects,
  actionMultipleOrSingle,
  standardInterpreters,
  
  // Classes
  CustomAxiosClient,
  Operation,
  OperationQueue,
  Getter,
  Processor,
  ProcessorPipeline,
};