const { respond, mandateParam } = require('../utils');

const bleckmannSkuGet = async (
  sku,
  {
    credsPath,
  } = {},
) => {

  return { 
    sku,
    credsPath,
  };
  
};

const bleckmannSkuGetApi = async (req, res) => {
  const { 
    sku,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'sku', sku),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannSkuGet(
    sku,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannSkuGet,
  bleckmannSkuGetApi,
};

// curl localhost:8000/bleckmannSkuGet -H "Content-Type: application/json" -d '{ "sku": "EXD1224-3-3XS/XXS" }'