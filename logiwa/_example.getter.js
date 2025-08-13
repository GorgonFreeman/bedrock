// https://mydeveloper.logiwa.com/#tag/Product/paths/~1v3.1~1Product~1list~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const FUNC = async (
  {
    credsPath,
    apiVersion = 'v3.1',

    page = 0,
    perPage = MAX_PER_PAGE,

    ...getterOptions
  } = {},
) => {

  const response = await logiwaGet(
    `/Product/list/i/${ page }/s/${ perPage }`,
    {
      credsPath,
      apiVersion,
      // params,
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const FUNCApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'orderId', orderId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await FUNC(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC
// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "options": { "limit": 10 } }'