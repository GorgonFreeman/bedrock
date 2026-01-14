// https://mydeveloper.logiwa.com/#tag/Product/paths/~1v3.1~1Product~1list~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { funcApi, logDeep } = require('../utils');
const { logiwaGet } = require('../logiwa/logiwa.utils');
const { MAX_PER_PAGE } = require('../logiwa/logiwa.constants');

const logiwaWebhooksGet = async (
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

const logiwaWebhooksGetApi = funcApi(logiwaWebhooksGet, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  logiwaWebhooksGet,
  logiwaWebhooksGetApi,
};

// curl localhost:8000/logiwaWebhooksGet
// curl localhost:8000/logiwaWebhooksGet -H "Content-Type: application/json" -d '{ "options": { "limit": 10 } }'