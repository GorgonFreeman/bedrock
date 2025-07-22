const fs = require('fs').promises;
const path = require('path');

const excludedPaths = ['node_modules', '_retired'];

const findApiFunctions = async () => {

  const files = await fs.readdir('./', { recursive: true });
  // console.log(files);

  const filesWithoutExcluded = files.filter(file => {
    return !excludedPaths.some(excludedPath => {
      const beginsWithPathRegex = new RegExp(`^${ excludedPath }`);
      return beginsWithPathRegex.test(file);
    });
  });
  // console.log(filesWithoutExcluded);

  const jsFiles = filesWithoutExcluded.filter(file => {
    const extension = path.extname(file);
    const basename = path.basename(file);
    return extension === '.js' && basename[0] !== '_';
  });
  // console.log(jsFiles);

  const endsWithApiRegex = /Api$/;
  const servableFunctions = [];

  for (const file of jsFiles) {
    const fileContent = await fs.readFile(file, 'utf-8');

    const moduleExportsRegex = /module\.exports\s*=\s*\{([^}]*)\}/gs;
    const moduleExportsMatches = fileContent.match(moduleExportsRegex);
    if (!moduleExportsMatches || moduleExportsMatches.length === 0) {
      continue;
    }

    const apiFuncRegex = /\b\w+Api\b/g;
    const apiFuncMatches = moduleExportsMatches[0].match(apiFuncRegex);
    if (!apiFuncMatches || apiFuncMatches.length === 0) {
      continue;
    }

    const extension = path.extname(file);
    const extensionOnEndRegex = new RegExp(`${ extension }$`);

    servableFunctions.push({
      path: file.replace(extensionOnEndRegex, ''),
      name: path.basename(file, path.extname(file)),
    });
  };
  // console.log('servableFunctions', servableFunctions);
  
  return servableFunctions;
};

module.exports = {
  findApiFunctions,
};