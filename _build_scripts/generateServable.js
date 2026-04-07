const fs = require('fs').promises;
const { findApiFunctions } = require('./findApiFunctions'); 

const generateServable = async () => {
  const servableFunctions = await findApiFunctions();
  const moduleExportsEntries = [];
  
  for (const func of servableFunctions) {
    try {
      const moduleExport = require(`../${ func.path }`);
      
      for (const apiFuncName of func.apiFunctions) {
        const funcName = apiFuncName.replace('Api', '');
        const apiFunc = moduleExport[apiFuncName];
        
        if (apiFunc && typeof apiFunc === 'function') {
          moduleExportsEntries.push(
            `  ${ funcName }: lazy(() => require('./${ func.path }').${ apiFuncName }),`,
          );
        }
      }
    } catch (error) {
      console.warn(`Could not load ${ func.path }:`, error.message);
    }
  }
  
  const newServableContent = `const lazy = (loader) => {
  let cached;
  return (req, res) => {
    if (!cached) {
      cached = loader();
    }
    return cached(req, res);
  };
};

module.exports = {
${ moduleExportsEntries.join('\n') }
};`;
  
  // Check if the file exists and read current content
  let existingContent = '';
  try {
    existingContent = await fs.readFile('./servable.js', 'utf8');
  } catch (error) {
    // File doesn't exist, which is fine for the first run
  }
  
  // Only write if content has changed
  if (existingContent !== newServableContent) {
    await fs.writeFile('./servable.js', newServableContent);
    console.log(`Generated servable.js with ${ moduleExportsEntries.length } functions`);
  } else {
    console.log(`servable.js unchanged, skipping write`);
  }
};

generateServable();