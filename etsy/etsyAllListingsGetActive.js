// https://developers.etsy.com/documentation/reference/#operation/findAllListingsActive

const { respond, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyAllListingsGetActive = async (
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

const etsyAllListingsGetActiveApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyAllListingsGetActive(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyAllListingsGetActive,
  etsyAllListingsGetActiveApi,
};

// curl localhost:8000/etsyAllListingsGetActive 
// curl localhost:8000/etsyAllListingsGetActive -H "Content-Type: application/json" -d '{ "options": { "limit": 600 } }'