const fs = require('fs').promises;

const { extractCodeBetween } = require('../utils');

const { findApiFunctions } = require('./findApiFunctions');

const updateServableFunctions = async (fullFunctionList) => {
  const servFilePath = './servable.js';
  const servFileContents = await fs.readFile(servFilePath, 'utf-8');
  // console.log('servFileContents', servFileContents);

  const servImport = extractCodeBetween(servFileContents, `const servableFunctions = [`, `]`, { excludeEnds: true });
  // console.log('servImport', servImport);

  if (!servImport) {
    console.error(`Something went wrong updating servable.js`);
    return;
  }

  const servImportLines = servImport.split('\n');
  const servImportFuncPaths = servImportLines.map(line => line.trim().replace(/['",]/g, '')).filter(line => line);
  // console.log('servImportFuncPaths', servImportFuncPaths);

  const missingFuncs = fullFunctionList.filter(func => servImportFuncPaths.indexOf(func.path) === -1);
  // console.log('missingFuncs', missingFuncs);

  if (missingFuncs.length === 0) {
    console.log('No update needed');
    return;
  }

  // Derive the existing format and copy it, or fall back if no functions exist yet
  let exampleFuncPath = `example/doSomething`;
  let exampleLine = `  '${ exampleFuncPath }',`;

  if (servImportFuncPaths.length > 0) {
    const firstFuncPath = servImportFuncPaths[0];
    const firstFuncLine = servImportLines.find(line => line.includes(firstFuncPath));
    exampleLine = firstFuncLine;
    exampleFuncPath = firstFuncPath;
  }

  const newFuncLines = missingFuncs.map(func => exampleLine.replace(exampleFuncPath, func.path));
  const newServImport = `\n${ newFuncLines.join('\n') }${ servImport }`;
  // console.log('newServImport', newServImport);
  await fs.writeFile(servFilePath, servFileContents.replace(servImport, newServImport));
  console.log('Updated');
};

(async() => {
  const servableFunctions = await findApiFunctions();
  // console.log(servableFunctions);
  await updateServableFunctions(servableFunctions);
})();

// TO DO: Remove unfindable functions