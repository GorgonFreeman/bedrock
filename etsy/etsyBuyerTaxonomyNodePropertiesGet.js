// https://developers.etsy.com/documentation/reference/#operation/getPropertiesByBuyerTaxonomyId

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyBuyerTaxonomyNodePropertiesGet = async (
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

const etsyBuyerTaxonomyNodePropertiesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await etsyBuyerTaxonomyNodePropertiesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyBuyerTaxonomyNodePropertiesGet,
  etsyBuyerTaxonomyNodePropertiesGetApi,
};

// curl localhost:8000/etsyBuyerTaxonomyNodePropertiesGet