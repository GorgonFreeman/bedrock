const { respond, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyTaxonomyNodesGet = async (
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/buyer-taxonomy/nodes`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyTaxonomyNodesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyTaxonomyNodesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyTaxonomyNodesGet,
  etsyTaxonomyNodesGetApi,
};

// curl localhost:8000/etsyTaxonomyNodesGet