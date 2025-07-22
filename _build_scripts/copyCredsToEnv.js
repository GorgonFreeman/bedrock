const fs = require('fs').promises;

// Dependencies read from the file location
const { readFileYaml } = require('../utils');

(async() => {
  const { CREDS } = process.env;
  const replaceCredsString = `CREDS=${ CREDS }`;

  // File paths read from the run location
  const credsFromYml = await readFileYaml('.creds.yml');
  // console.log(credsFromYml);
  const credsJsonString = JSON.stringify(credsFromYml);
  const newCredsString = `CREDS=${ credsJsonString }`;

  if (replaceCredsString === newCredsString) {
    // creds already up to date
    return;
  }

  const envFileContents = await fs.readFile('.env', 'utf8');

  if (envFileContents.includes(replaceCredsString)) {
    const updatedFileContents = envFileContents.replace(replaceCredsString, newCredsString);
    return await fs.writeFile('.env', updatedFileContents);
  }

  return await fs.appendFile('.env', `\n\n${ newCredsString }`);
})();