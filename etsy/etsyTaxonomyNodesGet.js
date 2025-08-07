const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyTaxonomyNodesGet = async (
  arg,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/things/${ arg }`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyTaxonomyNodesGetApi = async (req, res) => {
  const { 
    arg,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'arg', arg),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyTaxonomyNodesGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyTaxonomyNodesGet,
  etsyTaxonomyNodesGetApi,
};

// curl localhost:8000/etsyTaxonomyNodesGet