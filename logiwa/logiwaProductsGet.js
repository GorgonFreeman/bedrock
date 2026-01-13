// https://mydeveloper.logiwa.com/#tag/Product/paths/~1v3.1~1Product~1list~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep } = require('../utils');
const { logiwaGet, logiwaGetter } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const payloadMaker = (
  {
    credsPath,
    apiVersion = 'v3.1',

    page = 0,
    perPage = MAX_PER_PAGE,

    sku_eq,
    fnsku_eq,
    clientIdentifier_eq,
    clientIdentifier_in,
    identifier_eq,
    createdDateTime_bt,
    updatedDateTime_bt,
    productTypeName_eq,
    productGroupName_eq,

    ...getterOptions
  } = {},
) => {

  const params = {
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(fnsku_eq && { 'FNSKU.eq': fnsku_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(clientIdentifier_in && { 'ClientIdentifier.in': clientIdentifier_in }),
    ...(identifier_eq && { 'Identifier.eq': identifier_eq }),
    ...(createdDateTime_bt && { 'CreatedDateTime.bt': createdDateTime_bt }),
    ...(updatedDateTime_bt && { 'UpdatedDateTime.bt': updatedDateTime_bt }),
    ...(productTypeName_eq && { 'ProductTypeName.eq': productTypeName_eq }),
    ...(productGroupName_eq && { 'ProductGroupName.eq': productGroupName_eq }),
  };

  return [
    `/Product/list/i/${ page }/s/${ perPage }`,
    {
      credsPath,
      apiVersion,
      params,
      ...getterOptions,
    },
  ];
};

const logiwaProductsGet = async (...args) => {
  const response = await logiwaGet(...payloadMaker(...args));
  return response;
};

const logiwaProductsGetter = async (...args) => {
  const response = await logiwaGetter(...payloadMaker(...args));
  return response;
};

const logiwaProductsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'orderId', orderId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await logiwaProductsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaProductsGet,
  logiwaProductsGetter,
  logiwaProductsGetApi,
};

// curl localhost:8000/logiwaProductsGet
// curl localhost:8000/logiwaProductsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 10 } }'
// curl localhost:8000/logiwaProductsGet -H "Content-Type: application/json" -d '{ "options": { "sku_eq": "EXD1684-2-L" } }'
// curl localhost:8000/logiwaProductsGet -H "Content-Type: application/json" -d '{ "options": { "clientIdentifier_eq": "9f1ea39a-fccc-48af-8986-a35c34fcef8b" } }'