const { respond, mandateParam, credsByPath, CustomAxiosClient, logDeep } = require('../utils');

const bleckmannSkuGet = async (
  sku,
  {
    credsPath,
  } = {},
) => {

  const bleckmannRequestSetup = (credsPath) => {
    const creds = credsByPath(['bleckmann', credsPath]);
    const { 
      BASE_URL,
      PRIMARY_KEY,
    } = creds;
  
    const headers = {
      'x-api-key': PRIMARY_KEY,
    };
  
    return {
      baseUrl: BASE_URL,
      headers,
    };
  };

  const { baseUrl, headers } = bleckmannRequestSetup(credsPath);

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