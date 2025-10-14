// https://api-docs.starshipit.com/#ccf0f10f-e370-45c0-ba5c-13bfaac80ca6

const { funcApi, logDeep } = require('../utils');
const { starshipitGet, starshipitGetter } = require('../starshipit/starshipit.utils');

const payloadMaker = (
  credsPath,
  {
    ...getterOptions
  } = {},
) => {

  return [
    credsPath,
    '/products',
    {
      nodeName: 'products',
      ...getterOptions,
    },
  ];
};

const starshipitProductsGet = async (...args) => {
  const response = await starshipitGet(...payloadMaker(...args));
  logDeep(response);
  return response;
};

const starshipitProductsGetter = async (...args) => {
  const response = await starshipitGetter(...payloadMaker(...args));
  return response;
};

const starshipitProductsGetApi = funcApi(starshipitProductsGet, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  starshipitProductsGet,
  starshipitProductsGetter,
  starshipitProductsGetApi,
};

// curl localhost:8000/starshipitProductsGet -H "Content-Type: application/json" -d '{ "credsPath": "wf" }' 
// curl localhost:8000/starshipitProductsGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "options": { "perPage": 15 } }' 