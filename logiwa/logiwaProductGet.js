// https://mydeveloper.logiwa.com/#tag/Product/paths/~1v3.1~1Product~1detail~1%7Bid%7D/get

const { respond, mandateParam } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaProductGet = async (
  productId,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'get',
    url: `/Product/detail/${ productId }`,
  });
  logDeep(response);
  return response;
};

const logiwaProductGetApi = async (req, res) => {
  const { 
    productId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'productId', productId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await logiwaProductGet(
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaProductGet,
  logiwaProductGetApi,
};

// curl localhost:8000/logiwaProductGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'