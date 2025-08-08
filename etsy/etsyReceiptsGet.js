const { respond, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyReceiptsGet = async (
  {
    credsPath,
    perPage,
    ...getterOptions
  } = {},
) => {
  const response = await etsyGet(
    '/application/listings/active',
    { 
      context: {
        credsPath,
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const etsyReceiptsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyReceiptsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyReceiptsGet,
  etsyReceiptsGetApi,
};

// curl localhost:8000/etsyReceiptsGet 
// curl localhost:8000/etsyReceiptsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 600 } }'