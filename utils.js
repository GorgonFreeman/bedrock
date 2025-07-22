const jsYaml = require('js-yaml');
const fs = require('fs').promises;
const readline = require('readline');

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

  const nodes = Array.isArray(path) ? path : path.split('.').filter(n => n);
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

  const creds = (() => {

    let cumulativeCreds;
    let currentNode = CREDS;

    for (const [index, node] of nodes.entries()) {

      const nextNode = currentNode?.[node];
  
      if (!nextNode) {
        console.error(`No creds found at ${ path }, failed at ${ node } - falling back.`);
        return cumulativeCreds;
      }
  
      cumulativeCreds = {
        ...cumulativeCreds,
        ...nextNode,
      };
  
      currentNode = nextNode;
    }

    return cumulativeCreds;

  })();

  // Keep only uppercase attributes
  for (const k of Object.keys(creds)) {
    if (k !== k.toUpperCase()) {
      delete creds[k];
    }
  }
  
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

module.exports = {
  wait,
  respond,
  askQuestion,
  credsByPath,
  logDeep,

  arrayFromIntRange,
  extractCodeBetween,
  readFileYaml,
  writeFileYaml,
  capitaliseString,
};