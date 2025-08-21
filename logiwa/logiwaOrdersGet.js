// https://mydeveloper.logiwa.com/#tag/ShipmentOrder/paths/~1v3.1~1ShipmentOrder~1list~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

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
    updatedDateTime_bt,
    code_eq,
    warehouseIdentifier_eq,
    warehouseIdentifier_in,
    identifier_eq,
    clientIdentifier_eq,
    clientIdentifier_in,
    createdDateTime_bt,
    actualShipmentDate_bt,
    shipmentOrderDate_bt,
    status_in,
    status_eq,
    expectedShipmentDate_bt,
    shipmentOrderTypeName_eq,

    ...getterOptions
  } = {},
) => {

  const params = {
    ...(sku_eq && { 'Sku.eq': sku_eq }),
    ...(updatedDateTime_bt && { 'UpdatedDateTime.bt': updatedDateTime_bt }),
    ...(code_eq && { 'Code.eq': code_eq }),
    ...(warehouseIdentifier_eq && { 'WarehouseIdentifier.eq': warehouseIdentifier_eq }),
    ...(warehouseIdentifier_in && { 'WarehouseIdentifier.in': warehouseIdentifier_in }),
    ...(identifier_eq && { 'Identifier.eq': identifier_eq }),
    ...(clientIdentifier_eq && { 'ClientIdentifier.eq': clientIdentifier_eq }),
    ...(clientIdentifier_in && { 'ClientIdentifier.in': clientIdentifier_in }),
    ...(createdDateTime_bt && { 'CreatedDateTime.bt': createdDateTime_bt }),
    ...(actualShipmentDate_bt && { 'ActualShipmentDate.bt': actualShipmentDate_bt }),
    ...(shipmentOrderDate_bt && { 'ShipmentOrderDate.bt': shipmentOrderDate_bt }),
    ...(status_in && { 'Status.in': status_in }),
    ...(status_eq && { 'Status.eq': status_eq }),
    ...(expectedShipmentDate_bt && { 'ExpectedShipmentDate.bt': expectedShipmentDate_bt }),
    ...(shipmentOrderTypeName_eq && { 'ShipmentOrderTypeName.eq': shipmentOrderTypeName_eq }),
  };

  return [
    `/ShipmentOrder/list/i/${ page }/s/${ perPage }`,
    {
      credsPath,
      apiVersion,
      params,
      ...getterOptions,
    },
  ];
};

const logiwaOrdersGet = async (...args) => {
  const response = await logiwaGet(...payloadMaker(...args));
  return response;
};

const logiwaOrdersGetter = async (...args) => {
  const response = await logiwaGetter(...payloadMaker(...args));
  return response;
};

const logiwaOrdersGetApi = async (req, res) => {  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'orderId', orderId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await logiwaOrdersGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaOrdersGet,
  logiwaOrdersGetter,
  logiwaOrdersGetApi,
};

// curl localhost:8000/logiwaOrdersGet
// curl localhost:8000/logiwaOrdersGet -H "Content-Type: application/json" -d '{ "options": { "createdDateTime_bt": "2025-05-21T00:00:00Z,2025-05-22T00:00:00Z" } }'
// curl localhost:8000/logiwaOrdersGet -H "Content-Type: application/json" -d '{ "options": { "code_eq": "#USA4165771" } }'