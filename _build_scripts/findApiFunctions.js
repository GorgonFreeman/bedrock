const fs = require('fs').promises;
const path = require('path');

const excludedPaths = ['node_modules', '_retired', '_build_scripts'];

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
      // Get the file path without extension for require
      const extension = path.extname(file);
      const extensionOnEndRegex = new RegExp(`${ extension }$`);
      const requirePath = file.replace(extensionOnEndRegex, '');
      
      // Dynamically require the module
      const moduleExports = require(`../${ requirePath }`);
      
      // Find all exported functions ending in "Api"
      const apiFunctions = Object.keys(moduleExports).filter(key => 
        key.endsWith('Api') && typeof moduleExports[key] === 'function'
      );

      if (apiFunctions.length > 0) {
        servableFunctions.push({
          path: requirePath,
          name: path.basename(file, path.extname(file)),
          apiFunctions, // Include the actual API function names found
        });
      }
    } catch (error) {
      // Skip files that can't be required (like utils files)
      console.warn(`Could not load ${ file }:`, error.message);
    }
  }

  return servableFunctions;
};

module.exports = {
  findApiFunctions,
};