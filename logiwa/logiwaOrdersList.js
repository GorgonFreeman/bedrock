// https://mydeveloper.logiwa.com/#tag/ShipmentOrder/paths/~1v3.1~1ShipmentOrder~1list~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const logiwaOrdersList = async (
  {
    credsPath,
    apiVersion = 'v3.1',
    page = 1,
    perPage = MAX_PER_PAGE,
  } = {},
) => {

  const response = await logiwaGet(
    `/ShipmentOrder/list/i/${ page }/s/${ perPage }`,
    {
      credsPath,
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const logiwaOrdersListApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'orderId', orderId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await logiwaOrdersList(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaOrdersList,
  logiwaOrdersListApi,
};

// curl localhost:8000/logiwaOrdersList