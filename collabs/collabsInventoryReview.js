const { respond, mandateParam } = require('../utils');

const collabsInventoryReview = async (
  region,
  {
    option,
  } = {},
) => {

  return { 
    region, 
    option,
  };
  
};

const collabsInventoryReviewApi = async (req, res) => {
  const { 
    region,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'region', region),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await collabsInventoryReview(
    region,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsInventoryReview,
  collabsInventoryReviewApi,
};

// curl localhost:8000/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "au" }'