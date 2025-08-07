const { respond, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsySellerTaxonomyNodesGet = async (
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: '/application/seller-taxonomy/nodes',
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsySellerTaxonomyNodesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsySellerTaxonomyNodesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsySellerTaxonomyNodesGet,
  etsySellerTaxonomyNodesGetApi,
};

// curl localhost:8000/etsySellerTaxonomyNodesGet