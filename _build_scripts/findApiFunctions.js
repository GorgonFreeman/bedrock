const fs = require('fs').promises;
const path = require('path');

const excludedPaths = [
  'node_modules', 
  '_retired', 
  '_build_scripts', 
  'utils.js', 
  'servable.js', 
  'server.js', 
  'server.utils.js',
];

const findApiFunctions = async () => {
  const files = await fs.readdir('./', { recursive: true });
  
  const filesWithoutExcluded = files.filter(file => {
    return !excludedPaths.some(excludedPath => {
      const beginsWithPathRegex = new RegExp(`^${ excludedPath }`);
      return beginsWithPathRegex.test(file);
    });
  });

  const jsFiles = filesWithoutExcluded.filter(file => {
    const extension = path.extname(file);
    const basename = path.basename(file);
    return extension === '.js' && basename[0] !== '_';
  });

  const servableFunctions = [];

  for (const file of jsFiles) {
    try {
      const requirePath = file.replace(/\.js$/, '');
      const moduleExports = require(`../${ requirePath }`);
      
      // Find all exported functions ending in "Api"
      const apiFunctions = Object.keys(moduleExports).filter(key => 
        key.endsWith('Api') && typeof moduleExports[key] === 'function'
      );

      if (apiFunctions.length > 0) {
        servableFunctions.push({
          path: requirePath,
          apiFunctions,
        });
      }
    } catch (error) {
      // Skip files that can't be required
      console.warn(`Could not load ${ file }:`, error.message);
    }
  }

  return servableFunctions;
};

module.exports = {
  findApiFunctions,
};