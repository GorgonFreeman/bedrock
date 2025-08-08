// https://developers.etsy.com/documentation/reference/#operation/getPropertiesByTaxonomyId

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsySellerTaxonomyNodePropertiesGet = async (
  taxonomyNodeId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/seller-taxonomy/nodes/${ taxonomyNodeId }/properties`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsySellerTaxonomyNodePropertiesGetApi = async (req, res) => {
  const { 
    taxonomyNodeId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'taxonomyNodeId', taxonomyNodeId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsySellerTaxonomyNodePropertiesGet(
    taxonomyNodeId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsySellerTaxonomyNodePropertiesGet,
  etsySellerTaxonomyNodePropertiesGetApi,
};

// curl localhost:8000/etsySellerTaxonomyNodePropertiesGet -H "Content-Type: application/json" -d '{ "taxonomyNodeId": 873 }'