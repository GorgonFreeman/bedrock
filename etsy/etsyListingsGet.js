const { respond, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyListingsGet = async (
  {
    credsPath,
  } = {},
) => {
  const response = await etsyGet(
    '/application/listings/active',
    { 
      context: {
        credsPath,
      },
    },
  );
  logDeep(response);
  return response;
};

const etsyListingsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyListingsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingsGet,
  etsyListingsGetApi,
};

// curl localhost:8000/etsyListingsGet 
// curl localhost:8000/etsyListingsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 600 } }'