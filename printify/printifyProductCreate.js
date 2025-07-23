const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyProductCreate = async (
  title,
  description,
  blueprintId,
  printProviderId,
  variants,
  printAreas,
  { 
    credsPath, 
    shopId,
  } = {},
) => {

  if (!shopId) {
    const { SHOP_ID } = credsByPath(['printify', credsPath]);
    shopId = SHOP_ID;
  }

  if (!shopId) {
    return {
      success: false,
      error: ['shopId is required'],
    };
  }

  const productCreatePayload = {
    title,
    description,
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    variants,
    print_areas: printAreas,
  };

  const response = await printifyClient.fetch({
    url: `/shops/${ shopId }/products.json`, 
    method: 'post',
    body: productCreatePayload,
    verbose: true,
    factoryArgs: [credsPath],
  });  

  logDeep(response);
  return response;
  
};

const printifyProductCreateApi = async (req, res) => {
  const { 
    title,
    description,
    blueprintId,
    printProviderId,
    variants,
    printAreas,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'title', title),
    mandateParam(res, 'description', description),
    mandateParam(res, 'blueprintId', blueprintId),
    mandateParam(res, 'printProviderId', printProviderId),
    mandateParam(res, 'variants', variants, p => Array.isArray(p)),
    mandateParam(res, 'printAreas', printAreas, p => Array.isArray(p)),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyProductCreate(
    title,
    description,
    blueprintId,
    printProviderId,
    variants,
    printAreas,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyProductCreate,
  printifyProductCreateApi,
};

// curl localhost:8000/printifyProductCreate -H "Content-Type: application/json" -d '{ ... }'