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
          moduleExportsEntries.push(`  ${ funcName }: require('./${ func.path }').${ apiFuncName },`);
        }
      }
    } catch (error) {
      console.warn(`Could not load ${ func.path }:`, error.message);
    }
  }
  
  const newServableContent = `module.exports = {
${ moduleExportsEntries.join('\n') }
};`;
  
  await fs.writeFile('./servable.js', newServableContent);
  console.log(`Generated servable.js with ${ moduleExportsEntries.length } functions`);
};

generateServable();