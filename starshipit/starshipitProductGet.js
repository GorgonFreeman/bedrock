// https://api-docs.starshipit.com/#ccf0f10f-e370-45c0-ba5c-13bfaac80ca6

const { funcApi, logDeep, standardInterpreters } = require('../utils');
const { starshipitProductsGet } = require('../starshipit/starshipitProductsGet');

const starshipitProductGet = async (
  credsPath,
  productSku,
) => {

  const response = await starshipitProductsGet(
    credsPath,
    {
      searchTerm: productSku,
    },
  );

  const singleResponse = standardInterpreters.expectOne(response);
  
  logDeep(singleResponse);
  return singleResponse;
};

const starshipitProductGetApi = funcApi(starshipitProductGet, {
  argNames: ['credsPath', 'productSku'],
});

module.exports = {
  starshipitProductGet,
  starshipitProductGetApi,
};

// curl localhost:8000/starshipitProductGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "productSku": "WFAL48-1-S" }' 