// https://developers.etsy.com/documentation/reference/#operation/findShops

const { respond, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyShopsGet = async (
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: '/application/shops',
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyShopsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyShopsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyShopsGet,
  etsyShopsGetApi,
};

// curl localhost:8000/etsyShopsGet 