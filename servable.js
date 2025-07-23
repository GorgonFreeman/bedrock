const servableFunctions = [
  'printify/printifyOrdersSubmit',
  'printify/printifyProductsGet',
  'printify/printifyOrderSubmit',
  'printify/printifyOrdersGet',
  'printify/printifyOrdersCreate',
  'printify/printifyOrderGet',
  'printify/printifyOrderCreate',
  'printify/printifyOrderCancel',
  'printify/printifyImageUpload',
  'printify/printifyBlueprintPrintProviderVariantsGet',
  'printify/printifyBlueprintPrintProvidersGet',
  'printify/printifyBlueprintGet',
  'printify/printifyBlueprintsGet',
];

module.exports = Object.fromEntries(servableFunctions.map(funcPath => {
  const funcPathParts = funcPath.split('/');
  const funcName = funcPathParts[funcPathParts.length - 1];
  const apiFuncName = `${ funcName }Api`;
  const moduleExport = require(`./${ funcPath }`);
  const apiFunc = moduleExport[apiFuncName]
  return [funcName, apiFunc];
}));
