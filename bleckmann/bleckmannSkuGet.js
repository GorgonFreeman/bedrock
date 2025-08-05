const { respond, mandateParam, credsByPath, CustomAxiosClient, logDeep } = require('../utils');
const { bleckmannRequestSetup } = require('../bleckmann/bleckmann.utils');

const bleckmannSkuGet = async (
  sku,
  {
    credsPath,
  } = {},
) => {

  const { baseUrl, headers } = bleckmannRequestSetup({ credsPath });

  const client = new CustomAxiosClient({
    baseUrl,
    baseHeaders: headers,
  });

  const response = await client.fetch({
    url: `/skus/${ encodeURIComponent(sku) }`,
  });

  logDeep(response);
  return response;
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