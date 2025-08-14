// https://mydeveloper.logiwa.com/#tag/Product/paths/~1v3.1~1Product~1detail~1%7Bid%7D/get

const { respond, mandateParam, logDeep, objHasAny, standardInterpreters } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { logiwaProductsGet } = require('../logiwa/logiwaProductsGet');

const logiwaProductGet = async (
  {
    productId,
    sku,
  },
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {
  
  if (productId) {
    const response = await logiwaClient.fetch({
      method: 'get',
      url: `/Product/detail/${ productId }`,
    });
    logDeep(response);
    return response;
  }

  /* sku */
  const productsGetResponse = await logiwaProductsGet({
    sku_eq: sku,
    credsPath,
    apiVersion,
  });
  
  const singleResponse = standardInterpreters.expectOne(productsGetResponse);

  logDeep(singleResponse);
  return singleResponse;
  /* /sku */
};

const logiwaProductGetApi = async (req, res) => {
  const { 
    productIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'productIdentifier', productIdentifier, p => objHasAny(p, ['productId', 'sku'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await logiwaProductGet(
    productIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaProductGet,
  logiwaProductGetApi,
};

// curl localhost:8000/logiwaProductGet -H "Content-Type: application/json" -d '{ "productIdentifier": { "productId": "261a02aa-ce5a-4b06-a528-d419e0aa87a1" } }'
// curl localhost:8000/logiwaProductGet -H "Content-Type: application/json" -d '{ "productIdentifier": { "sku": "EXD1684-2-L" } }'